import { createTransactionMock } from 'test/helpers/transaction.mock';
import { DepositUseCase } from './deposit.use-case';
import { createDatetimeServiceMock } from 'test/mocks/technical/datetime-service.mock';
import { createClsServiceMock } from 'test/mocks/kafka/cls-service.mock';
import { createUsersRepositoryMock } from 'test/mocks/users/users-repository.mock';
import { createLedgerRepositoryMock } from 'test/mocks/ledger/ledger-repository.mock';
import { createLedgerOutboxRepositoryMock } from 'test/mocks/ledger/ledger-outbox-repository.mock';
import { randomUserId } from 'test/faker/random-user-id';
import { randomCorrelationId } from 'test/faker/random-correlation-id';
import { DepositValue } from '@domain/ledger/value-objects/deposit-value';
import { UserEntity } from '@modules/users/entities/user.entity';
import { mock } from 'vitest-mock-extended';
import { LedgerEntryEntity } from '@domain/ledger/entities/ledger.entity';
import { LedgerOutboxEntity } from '@domain/ledger/entities/ledger-outbox.entity';
import { UserDoesNotExistError } from '@domain/users/errors/user-does-not-exist.error';

describe('DepositUseCase', () => {
  const { datasourceMock, entityManagerMock, resetTransactionMock } =
    createTransactionMock();
  const { datetimeServiceMock, resetDatetimeServiceMock } =
    createDatetimeServiceMock();
  const { clsServiceMock, resetClsServiceMock } = createClsServiceMock();
  const { usersRepositoryMock, resetUsersRepositoryMock } =
    createUsersRepositoryMock();
  const { ledgerRepositoryMock, resetLedgerRepositoryMock } =
    createLedgerRepositoryMock();
  const { ledgerOutboxRepositoryMock, resetLedgerOutboxRepositoryMock } =
    createLedgerOutboxRepositoryMock();

  const now = new Date();
  const correlationId = randomCorrelationId();

  const useCase = new DepositUseCase(
    datetimeServiceMock,
    datasourceMock,
    clsServiceMock,
  );

  beforeEach(() => {
    resetDatetimeServiceMock();
    datetimeServiceMock.new.mockReturnValue(now);

    resetClsServiceMock();
    clsServiceMock.getId.mockReturnValue(correlationId);

    resetTransactionMock();
    resetUsersRepositoryMock();
    resetLedgerRepositoryMock();
    resetLedgerOutboxRepositoryMock();

    entityManagerMock.getRepository.mockReturnValueOnce(usersRepositoryMock);
    entityManagerMock.getRepository.mockReturnValueOnce(ledgerRepositoryMock);
    entityManagerMock.getRepository.mockReturnValueOnce(
      ledgerOutboxRepositoryMock,
    );
  });

  describe('execute', () => {
    it('should create ledger entry with outbox event for active user', async () => {
      const userId = randomUserId();
      const depositValue = new DepositValue(123);
      const activeUserMock = mock<UserEntity>({
        id: userId,
        isActive: true,
      });

      usersRepositoryMock.findOne.mockResolvedValue(activeUserMock);

      await useCase.execute(userId, depositValue);

      const ledgerEntry = LedgerEntryEntity.deposit({
        userId,
        correlationId,
        createdAt: now,
        deposit: depositValue,
      });
      const ledgerOutboxEntry = LedgerOutboxEntity.deposited(ledgerEntry);

      expect(ledgerRepositoryMock.save).toHaveBeenCalledWith({
        ...ledgerEntry,
        id: expect.toBeString(),
        idempotencyKey: expect.toBeString(),
      });
      expect(ledgerOutboxRepositoryMock.save).toHaveBeenCalledWith({
        ...ledgerOutboxEntry,
        aggregateId: expect.toBeString(),
      });
    });

    it('should throw UserDoesNotExistError if user does not exist', async () => {
      const userId = randomUserId();
      const depositValue = new DepositValue(123);

      usersRepositoryMock.findOne.mockResolvedValue(null);

      await expect(useCase.execute(userId, depositValue)).rejects.toThrow(
        UserDoesNotExistError,
      );
    });
  });
});
