import { mock } from 'vitest-mock-extended';
import { randomUserId } from 'test/faker/random-user-id';
import { createDatetimeServiceMock } from 'test/mocks/technical/datetime-service.mock';
import { InsertQueryBuilder, SelectQueryBuilder } from 'typeorm';
import { LedgerUserLockEntity } from '@domain/ledger/entities/ledger-user-lock.entity';
import { vi } from 'vitest';
import { LedgerUserStateInitializerService } from './ledger-user-state-initializer.service';
import { createTransactionMock } from 'test/helpers/transaction.mock';
import { LedgerUserBalanceEntity } from '@domain/ledger/entities/ledger-user-balance.entity';

describe('LedgerUserStateInitializerService', () => {
  const { datasourceMock, entityManagerMock, resetTransactionMock } =
    createTransactionMock();
  const { datetimeServiceMock, resetDatetimeServiceMock } =
    createDatetimeServiceMock();

  const queryBuilderMock = mock<InsertQueryBuilder<LedgerUserLockEntity>>({
    insert: vi.fn().mockReturnThis(),
    into: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    orIgnore: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue({ identifiers: [] }),
  });

  const now = new Date();
  const userId = randomUserId();

  const service = new LedgerUserStateInitializerService(
    datetimeServiceMock,
    datasourceMock,
  );

  beforeEach(() => {
    resetDatetimeServiceMock();
    datetimeServiceMock.new.mockReturnValue(now);

    resetTransactionMock();
    entityManagerMock.createQueryBuilder.mockReturnValueOnce(
      queryBuilderMock as unknown as SelectQueryBuilder<LedgerUserLockEntity>,
    );
    entityManagerMock.createQueryBuilder.mockReturnValueOnce(
      queryBuilderMock as unknown as SelectQueryBuilder<LedgerUserBalanceEntity>,
    );
  });

  describe('initializeLedgerUserState', () => {
    it('should create entry', async () => {
      await service.initializeLedgerUserState(userId);

      expect(entityManagerMock.createQueryBuilder).toHaveBeenCalled();
      expect(queryBuilderMock.insert).toHaveBeenCalled();
      expect(queryBuilderMock.into).toHaveBeenCalledWith(LedgerUserLockEntity);
      expect(queryBuilderMock.values).toHaveBeenCalledWith(
        LedgerUserLockEntity.create(userId, now),
      );
      expect(queryBuilderMock.orIgnore).toHaveBeenCalled();
      expect(queryBuilderMock.execute).toHaveBeenCalled();

      expect(entityManagerMock.createQueryBuilder).toHaveBeenCalled();
      expect(queryBuilderMock.insert).toHaveBeenCalled();
      expect(queryBuilderMock.into).toHaveBeenCalledWith(
        LedgerUserBalanceEntity,
      );
      expect(queryBuilderMock.values).toHaveBeenCalledWith(
        LedgerUserBalanceEntity.create(userId),
      );
      expect(queryBuilderMock.orIgnore).toHaveBeenCalled();
      expect(queryBuilderMock.execute).toHaveBeenCalled();
    });
  });
});
