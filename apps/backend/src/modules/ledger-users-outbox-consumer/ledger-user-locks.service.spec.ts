import { mock } from 'vitest-mock-extended';
import { randomUserId } from 'test/faker/random-user-id';
import { createDatetimeServiceMock } from 'test/mocks/technical/datetime-service.mock';
import { createLedgerUserLockRepositoryMock } from 'test/mocks/ledger/ledger-user-lock-repository.mock';
import { InsertQueryBuilder, SelectQueryBuilder } from 'typeorm';
import { LedgerUserLockEntity } from '@domain/ledger/entities/ledger-user-lock.entity';
import { vi } from 'vitest';
import { LedgerUserLocksService } from './ledger-user-locks.service';

describe('LedgerUserLocksService', () => {
  const { datetimeServiceMock, resetDatetimeServiceMock } =
    createDatetimeServiceMock();
  const { ledgerUserLockRepositoryMock, resetLedgerUserLockRepositoryMock } =
    createLedgerUserLockRepositoryMock();

  const queryBuilderMock = mock<InsertQueryBuilder<LedgerUserLockEntity>>({
    insert: vi.fn().mockReturnThis(),
    into: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    orIgnore: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue({ identifiers: [] }),
  });

  const now = new Date();
  const userId = randomUserId();

  const service = new LedgerUserLocksService(
    ledgerUserLockRepositoryMock,
    datetimeServiceMock,
  );

  beforeEach(() => {
    resetDatetimeServiceMock();
    datetimeServiceMock.new.mockReturnValue(now);

    resetLedgerUserLockRepositoryMock();
    ledgerUserLockRepositoryMock.createQueryBuilder.mockReturnValue(
      queryBuilderMock as unknown as SelectQueryBuilder<LedgerUserLockEntity>,
    );
  });

  describe('initializeLedgerUserLock', () => {
    it('should create entry', async () => {
      await service.initializeLedgerUserLock(userId);

      expect(
        ledgerUserLockRepositoryMock.createQueryBuilder,
      ).toHaveBeenCalled();
      expect(queryBuilderMock.insert).toHaveBeenCalled();
      expect(queryBuilderMock.into).toHaveBeenCalledWith(LedgerUserLockEntity);
      expect(queryBuilderMock.values).toHaveBeenCalledWith(
        LedgerUserLockEntity.create(userId, now),
      );
      expect(queryBuilderMock.orIgnore).toHaveBeenCalled();
      expect(queryBuilderMock.execute).toHaveBeenCalled();
    });
  });
});
