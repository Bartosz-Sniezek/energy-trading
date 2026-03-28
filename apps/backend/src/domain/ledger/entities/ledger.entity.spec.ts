import { randomCorrelationId } from 'test/faker/random-correlation-id';
import { BalanceOperationOptions, LedgerEntryEntity } from './ledger.entity';
import { randomUserId } from 'test/faker/random-user-id';
import { LedgerEntryDirection, LedgerEntryType } from '../types';
import { version } from 'uuid';
import { MinorUnitValue } from '../value-objects/minor-unit-value';

describe('LedgerEntity', () => {
  const validBalanceOperation: BalanceOperationOptions = {
    value: new MinorUnitValue(123),
    correlationId: randomCorrelationId(),
    userId: randomUserId(),
    createdAt: new Date(),
  };

  describe('deposit', () => {
    it('should create deposit LedgerEntity', () => {
      const entity = LedgerEntryEntity.deposit(validBalanceOperation);

      expect(entity.correlationId).toBe(validBalanceOperation.correlationId);
      expect(entity.orderId).toBe(null);
      expect(entity.tradeId).toBe(null);
      expect(entity.userId).toBe(validBalanceOperation.userId);
      expect(entity.entryType).toBe(LedgerEntryType.DEPOSIT);
      expect(entity.direction).toBe(LedgerEntryDirection.CREDIT);
      expect(entity.amount).toBe(validBalanceOperation.value.toLedgerFormat());
      expect(version(entity.idempotencyKey)).toBe(7);
      expect(entity.createdAt.getTime()).toBe(
        validBalanceOperation.createdAt.getTime(),
      );
    });
  });

  describe('withdrawal', () => {
    it('should create withdrawal LedgerEntity', () => {
      const entity = LedgerEntryEntity.withdrawal(validBalanceOperation);

      expect(entity.correlationId).toBe(validBalanceOperation.correlationId);
      expect(entity.orderId).toBe(null);
      expect(entity.tradeId).toBe(null);
      expect(entity.userId).toBe(validBalanceOperation.userId);
      expect(entity.entryType).toBe(LedgerEntryType.WITHDRAWAL);
      expect(entity.direction).toBe(LedgerEntryDirection.DEBIT);
      expect(entity.amount).toBe(validBalanceOperation.value.toLedgerFormat());
      expect(version(entity.idempotencyKey)).toBe(7);
      expect(entity.createdAt.getTime()).toBe(
        validBalanceOperation.createdAt.getTime(),
      );
    });
  });
});
