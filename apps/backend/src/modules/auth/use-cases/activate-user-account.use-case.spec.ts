import { createTransactionMock } from 'test/helpers/transaction.mock';
import { ActivateUserAccountUseCase } from './activate-user-account.use-case';
import { mock, mockReset } from 'vitest-mock-extended';
import { Repository } from 'typeorm';
import { UserEntity } from '@domain/users/entities/user.entity';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { InvalidVerificationTokenError } from '@domain/auth/errors/invalid-verification-token.error';
import { UserAccountAlreadyActivatedError } from '@domain/auth/errors/user-account-already-activated.error';
import { addMinutes, subSeconds } from 'date-fns';
import { EmailVerificationTokenExpiredError } from '@domain/auth/errors/email-verification-token-expired.error';
import { UserOutboxEntity } from '@domain/users/entities/users-outbox.entity';
import { randomEmail } from 'test/faker/random-email';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { randomUUID } from 'crypto';
import { Hash } from '@domain/users/types';
import { createClsServiceMock } from 'test/mocks/kafka/cls-service.mock';
import { randomCorrelationId } from 'test/faker/random-correlation-id';

describe(ActivateUserAccountUseCase.name, () => {
  const usersRepositoryMock = mock<Repository<UserEntity>>();
  const outboxMock = mock<Repository<UserOutboxEntity>>();
  const { datasourceMock, entityManagerMock, resetTransactionMock } =
    createTransactionMock();
  const datetimeServiceMock = mock<DatetimeService>();
  const { clsServiceMock, resetClsServiceMock } = createClsServiceMock();
  const correlationId = randomCorrelationId();

  beforeEach(() => {
    resetTransactionMock();
    mockReset(usersRepositoryMock);
    mockReset(outboxMock);
    mockReset(datetimeServiceMock);
    resetClsServiceMock();
    entityManagerMock.getRepository.mockReturnValueOnce(usersRepositoryMock);
    entityManagerMock.getRepository.mockReturnValueOnce(outboxMock);
    clsServiceMock.getId.mockReturnValue(correlationId);
  });

  const useCase = new ActivateUserAccountUseCase(
    datasourceMock,
    datetimeServiceMock,
    clsServiceMock,
  );

  describe(useCase.execute.name, () => {
    it('should throw InvalidVerificationTokenError if user does not exsit', async () => {
      usersRepositoryMock.findOne.mockResolvedValue(null);

      await expect(useCase.execute({ token: 'some-token' })).rejects.toThrow(
        InvalidVerificationTokenError,
      );
    });

    it('should throw UserAccountAlreadyActivatedError if user account is already activated', async () => {
      const userMock = mock<UserEntity>({
        isActive: true,
      });
      usersRepositoryMock.findOne.mockResolvedValue(userMock);

      await expect(useCase.execute({ token: 'some-token' })).rejects.toThrow(
        UserAccountAlreadyActivatedError,
      );
    });

    it('should throw EmailVerificationTokenExpiredError if token has expired', async () => {
      const now = new Date();
      datetimeServiceMock.new.mockReturnValue(now);
      const userMock = mock<UserEntity>({
        isActive: false,
        activationTokenExpiresAt: subSeconds(now, 1),
      });
      usersRepositoryMock.findOne.mockResolvedValue(userMock);

      await expect(useCase.execute({ token: 'some-token' })).rejects.toThrow(
        EmailVerificationTokenExpiredError,
      );
    });

    it('should activate user account', async () => {
      const now = new Date();
      datetimeServiceMock.new.mockReturnValue(now);
      const user = UserEntity.create({
        email: randomEmail(),
        firstName: randomFirstName(),
        lastName: randomLastName(),
        activationToken: randomUUID(),
        activationTokenExpiresAt: addMinutes(now, 1),
        passwordHash: <Hash>'dsa',
        createdAt: new Date(),
      });
      usersRepositoryMock.findOne.mockResolvedValue(user);

      await expect(
        useCase.execute({ token: user.activationToken }),
      ).toResolve();
      expect(usersRepositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          activationToken: user.activationToken,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });
      expect(usersRepositoryMock.save).toHaveBeenCalledWith({
        ...user,
        isActive: true,
      });
      expect(outboxMock.save).toHaveBeenCalledWith(
        UserOutboxEntity.userAccountActivated(user.id, correlationId, {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }),
      );
    });
  });
});
