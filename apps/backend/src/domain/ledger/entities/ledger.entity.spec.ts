import { randomCorrelationId } from 'test/faker/random-correlation-id';
import {
  DepositLedgerOptions,
  LedgerEntity,
  WithdrawalLedgerOptions,
} from './ledger.entity';
import { randomUserId } from 'test/faker/random-user-id';
import { LedgerEntryType } from '../types';
import { InvalidDepositValueError } from '../errors/invalid-deposit-value.error';
import { InvalidWithdrawalValueError } from '../errors/invalid-withdrawal-value.error';

describe('LedgerEntity', () => {
  describe('deposit', () => {
    const validDepositLedger: DepositLedgerOptions = {
      amount: 123,
      correlationId: randomCorrelationId(),
      runningBalance: 123,
      userId: randomUserId(),
      createdAt: new Date(),
      description: 'xdd',
    };

    it('should create deposit LedgerEntity', () => {
      const entity = LedgerEntity.deposit(validDepositLedger);

      expect(entity.id).toBeString();
      expect(entity.correlationId).toBe(validDepositLedger.correlationId);
      expect(entity.userId).toBe(validDepositLedger.userId);
      expect(entity.entryType).toBe(LedgerEntryType.DEPOSIT);
      expect(entity.amount).toBe(validDepositLedger.amount);
      expect(entity.runningBalance).toBe(validDepositLedger.runningBalance);
      expect(entity.description).toBe(validDepositLedger.description);
      expect(entity.referenceId).toBe(null);
      expect(entity.referenceType).toBe(null);
      expect(entity.createdAt.getTime()).toBe(
        validDepositLedger.createdAt.getTime(),
      );
    });

    it('should create deposit LedgerEntity with default description', () => {
      const entity = LedgerEntity.deposit({
        ...validDepositLedger,
        description: undefined,
      });

      expect(entity.id).toBeString();
      expect(entity.correlationId).toBe(validDepositLedger.correlationId);
      expect(entity.userId).toBe(validDepositLedger.userId);
      expect(entity.entryType).toBe(LedgerEntryType.DEPOSIT);
      expect(entity.amount).toBe(validDepositLedger.amount);
      expect(entity.runningBalance).toBe(validDepositLedger.runningBalance);
      expect(entity.description).toBe(`Deposit: ${validDepositLedger.amount}`);
      expect(entity.referenceId).toBe(null);
      expect(entity.referenceType).toBe(null);
      expect(entity.createdAt.getTime()).toBe(
        validDepositLedger.createdAt.getTime(),
      );
    });

    it('should throw InvalidDepositValueError for ammount <= 0', () => {
      expect(() =>
        LedgerEntity.deposit({
          ...validDepositLedger,
          amount: 0,
        }),
      ).toThrow(InvalidDepositValueError);
    });
  });

  describe('withdrawal', () => {
    const validWithdrawalLedger: WithdrawalLedgerOptions = {
      amount: 123,
      correlationId: randomCorrelationId(),
      runningBalance: 123,
      userId: randomUserId(),
      createdAt: new Date(),
      description: 'xdd',
    };

    it('should create withdrawal LedgerEntity', () => {
      const entity = LedgerEntity.withdrawal(validWithdrawalLedger);

      expect(entity.id).toBeString();
      expect(entity.correlationId).toBe(validWithdrawalLedger.correlationId);
      expect(entity.userId).toBe(validWithdrawalLedger.userId);
      expect(entity.entryType).toBe(LedgerEntryType.WITHDRAWAL);
      expect(entity.amount).toBe(validWithdrawalLedger.amount);
      expect(entity.runningBalance).toBe(validWithdrawalLedger.runningBalance);
      expect(entity.description).toBe(validWithdrawalLedger.description);
      expect(entity.referenceId).toBe(null);
      expect(entity.referenceType).toBe(null);
      expect(entity.createdAt.getTime()).toBe(
        validWithdrawalLedger.createdAt.getTime(),
      );
    });

    it('should create withdrawal LedgerEntity with default description', () => {
      const entity = LedgerEntity.withdrawal({
        ...validWithdrawalLedger,
        description: undefined,
      });

      expect(entity.id).toBeString();
      expect(entity.correlationId).toBe(validWithdrawalLedger.correlationId);
      expect(entity.userId).toBe(validWithdrawalLedger.userId);
      expect(entity.entryType).toBe(LedgerEntryType.WITHDRAWAL);
      expect(entity.amount).toBe(validWithdrawalLedger.amount);
      expect(entity.runningBalance).toBe(validWithdrawalLedger.runningBalance);
      expect(entity.description).toBe(
        `Withdrawal: ${validWithdrawalLedger.amount}`,
      );
      expect(entity.referenceId).toBe(null);
      expect(entity.referenceType).toBe(null);
      expect(entity.createdAt.getTime()).toBe(
        validWithdrawalLedger.createdAt.getTime(),
      );
    });

    it('should throw InvalidWithdrawalValueError for ammount <= 0', () => {
      expect(() =>
        LedgerEntity.withdrawal({
          ...validWithdrawalLedger,
          amount: 0,
        }),
      ).toThrow(InvalidWithdrawalValueError);
    });
  });
});
