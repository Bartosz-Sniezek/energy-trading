import { randomCorrelationId } from 'test/faker/random-correlation-id';
import {
  DepositLedgerOptions,
  LedgerEntryEntity,
  WithdrawalLedgerOptions,
} from './ledger.entity';
import { randomUserId } from 'test/faker/random-user-id';
import { LedgerEntryDirection, LedgerEntryType } from '../types';
import { WithdrawalValue } from '../value-objects/withdrawal-value';
import { DepositValue } from '../value-objects/deposit-value';
import { version } from 'uuid';

describe('LedgerEntity', () => {
  describe('deposit', () => {
    const validDepositLedger: DepositLedgerOptions = {
      deposit: new DepositValue(123),
      correlationId: randomCorrelationId(),
      userId: randomUserId(),
      createdAt: new Date(),
    };

    it('should create deposit LedgerEntity', () => {
      const entity = LedgerEntryEntity.deposit(validDepositLedger);

      expect(entity.correlationId).toBe(validDepositLedger.correlationId);
      expect(entity.orderId).toBe(null);
      expect(entity.tradeId).toBe(null);
      expect(entity.userId).toBe(validDepositLedger.userId);
      expect(entity.entryType).toBe(LedgerEntryType.DEPOSIT);
      expect(entity.direction).toBe(LedgerEntryDirection.CREDIT);
      expect(entity.amount).toBe(validDepositLedger.deposit.toString());
      expect(version(entity.idempotencyKey)).toBe(7);
      expect(entity.createdAt.getTime()).toBe(
        validDepositLedger.createdAt.getTime(),
      );
    });
  });

  describe('withdrawal', () => {
    const validWithdrawalLedger: WithdrawalLedgerOptions = {
      withdrawal: new WithdrawalValue(123),
      correlationId: randomCorrelationId(),
      userId: randomUserId(),
      createdAt: new Date(),
    };

    it('should create withdrawal LedgerEntity', () => {
      const entity = LedgerEntryEntity.withdrawal(validWithdrawalLedger);

      expect(entity.correlationId).toBe(validWithdrawalLedger.correlationId);
      expect(entity.orderId).toBe(null);
      expect(entity.tradeId).toBe(null);
      expect(entity.userId).toBe(validWithdrawalLedger.userId);
      expect(entity.entryType).toBe(LedgerEntryType.WITHDRAWAL);
      expect(entity.direction).toBe(LedgerEntryDirection.DEBIT);
      expect(entity.amount).toBe(
        validWithdrawalLedger.withdrawal.toString(),
      );
      expect(version(entity.idempotencyKey)).toBe(7);
      expect(entity.createdAt.getTime()).toBe(
        validWithdrawalLedger.createdAt.getTime(),
      );
    });
  });
});
