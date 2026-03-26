import { mock, mockReset } from 'vitest-mock-extended';
import { AccountTokenActivationResendRequestedUseCase } from './account-token-activation-resend-requested.use-case';
import {
  DataSource,
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { UserEntity } from '@modules/users/entities/user.entity';
import { UserOutboxEntity } from '@modules/users/entities/users-outbox.entity';
import {
  AccountActivationChallenge,
  TokenService,
} from '@domain/auth/services/token.service';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { TokensService } from '@modules/users/token.service';
import { randomUUID } from 'crypto';
import { InvalidAccountActivationResendChallengeError } from '@domain/auth/errors/invalid-account-activation-resend-challenge.error';
import { randomEmail } from 'test/faker/random-email';
import { addDays, addMinutes, subSeconds } from 'date-fns';
import { AccountActivationResendRequestChallengeExpiredError } from '@domain/auth/errors/account-activation-resend-request-challenge-expired.error';
import { UserAccountAlreadyActivatedError } from '@domain/auth/errors/user-account-already-activated.error';
import { randomUserId } from 'test/faker/random-user-id';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { createClsServiceMock } from 'test/mocks/kafka/cls-service.mock';
import { randomCorrelationId } from 'test/faker/random-correlation-id';

describe(AccountTokenActivationResendRequestedUseCase.name, () => {
  const datasourceMock = mock<DataSource>();
  const entityManagerMock = mock<EntityManager>();

  datasourceMock.transaction.mockImplementation(async (...args: any[]) => {
    const cb = args.find((a) => typeof a === 'function');
    return cb(entityManagerMock);
  });

  const usersRepositoryMock = mock<Repository<UserEntity>>();
  const usersOutboxMock = mock<Repository<UserOutboxEntity>>();
  const authTokenServiceMock = mock<TokenService>();
  const usersTokenMock = mock<TokensService>();
  const datetimeServiceMock = mock<DatetimeService>();
  const { clsServiceMock, resetClsServiceMock } = createClsServiceMock();
  const now = new Date();
  const activationToken = randomUUID();
  const correlationId = randomCorrelationId();

  beforeEach(() => {
    mockReset(entityManagerMock);
    mockReset(usersRepositoryMock);
    mockReset(usersOutboxMock);
    resetClsServiceMock();
    clsServiceMock.getId.mockReturnValue(correlationId);
    entityManagerMock.getRepository.mockImplementation(
      (target: EntityTarget<ObjectLiteral>) => {
        if (target === UserEntity) return usersRepositoryMock;
        if (target === UserOutboxEntity) return usersOutboxMock;

        throw new Error('Unsupported');
      },
    );

    mockReset(usersTokenMock);
    usersTokenMock.generateToken.mockReturnValue(activationToken);
    mockReset(datetimeServiceMock);
    datetimeServiceMock.new.mockReturnValue(now);
    datetimeServiceMock.getDateIn24Hours.mockImplementation((date) =>
      addDays(date, 1),
    );
  });

  const useCase = new AccountTokenActivationResendRequestedUseCase(
    authTokenServiceMock,
    datasourceMock,
    usersTokenMock,
    datetimeServiceMock,
    clsServiceMock,
  );

  const validChallange: AccountActivationChallenge = {
    challengeKey: randomUUID(),
    email: randomEmail(),
    expiresAt: addMinutes(now, 5),
    token: randomUUID(),
  };
  const inactiveUserMock = mock<UserEntity>({
    id: randomUserId(),
    email: validChallange.email.getValue(),
    firstName: randomFirstName(),
    lastName: randomLastName(),
    isActive: false,
  });

  describe(
    AccountTokenActivationResendRequestedUseCase.prototype.execute.name,
    () => {
      it('should throw InvalidAccountActivationResendChallengeError if there is no token stored', async () => {
        authTokenServiceMock.getAccountActivationChallengeByToken.mockResolvedValue(
          null,
        );

        await expect(useCase.execute('some-token')).rejects.toThrow(
          InvalidAccountActivationResendChallengeError,
        );
      });

      it('should throw AccountActivationResendRequestChallengeExpiredError if stored token is expired', async () => {
        const tokenData: AccountActivationChallenge = {
          challengeKey: randomUUID(),
          email: randomEmail(),
          expiresAt: subSeconds(now, 1),
          token: randomUUID(),
        };
        authTokenServiceMock.getAccountActivationChallengeByToken.mockResolvedValue(
          tokenData,
        );

        await expect(useCase.execute('some-token')).rejects.toThrow(
          AccountActivationResendRequestChallengeExpiredError,
        );
      });

      it('should throw InvalidAccountActivationResendChallengeError if user does not exist', async () => {
        authTokenServiceMock.getAccountActivationChallengeByToken.mockResolvedValue(
          validChallange,
        );
        usersRepositoryMock.findOne.mockResolvedValue(null);

        await expect(useCase.execute('some-token')).rejects.toThrow(
          InvalidAccountActivationResendChallengeError,
        );
      });

      it('should throw UserAccountAlreadyActivatedError if user is active', async () => {
        authTokenServiceMock.getAccountActivationChallengeByToken.mockResolvedValue(
          validChallange,
        );
        const userMock = mock<UserEntity>({
          isActive: true,
        });
        usersRepositoryMock.findOne.mockResolvedValue(userMock);

        await expect(useCase.execute('some-token')).rejects.toThrow(
          UserAccountAlreadyActivatedError,
        );
      });

      it('should update user with new activation token', async () => {
        authTokenServiceMock.getAccountActivationChallengeByToken.mockResolvedValue(
          validChallange,
        );
        usersRepositoryMock.findOne.mockResolvedValue(inactiveUserMock);

        await expect(useCase.execute('some-token')).toResolve();
        expect(usersRepositoryMock.update).toHaveBeenCalledWith(
          {
            email: inactiveUserMock.email,
          },
          {
            activationToken,
            activationTokenExpiresAt: addDays(now, 1),
          },
        );
      });

      it('should store event in outbox', async () => {
        authTokenServiceMock.getAccountActivationChallengeByToken.mockResolvedValue(
          validChallange,
        );
        usersRepositoryMock.findOne.mockResolvedValue(inactiveUserMock);

        await expect(useCase.execute('some-token')).toResolve();
        expect(usersOutboxMock.save).toHaveBeenCalledWith(
          UserOutboxEntity.activationTokenResendRequested(
            inactiveUserMock.id,
            correlationId,
            {
              email: inactiveUserMock.email,
              activationToken,
              activationTokenExpirationDate: addDays(now, 1).toISOString(),
              firstName: inactiveUserMock.firstName,
              lastName: inactiveUserMock.lastName,
            },
          ),
        );
      });
    },
  );
});
