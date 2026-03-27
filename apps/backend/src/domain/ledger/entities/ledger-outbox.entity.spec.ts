import { randomCorrelationId } from 'test/faker/random-correlation-id';
import { randomUserId } from 'test/faker/random-user-id';
import {
  DepositedLedgerPayload,
  LedgerEntryType,
  LedgerEventType,
  WithdrawnLedgerPayload,
} from '../types';
import { WithdrawalValue } from '../value-objects/withdrawal-value';
import { DepositValue } from '../value-objects/deposit-value';
import { version } from 'uuid';
import { LedgerOutboxEntity } from './ledger-outbox.entity';
import { LedgerEntryEntity } from './ledger.entity';
import { InvalidLedgerEntryTypeError } from '../errors/invalid-ledger-entry-type.error';

describe('LedgerOutboxEntity', () => {
  const userId = randomUserId();
  const correlationId = randomCorrelationId();

  describe('deposit', () => {
    const deposit = new DepositValue(123);
    const entity = LedgerEntryEntity.deposit({
      userId,
      correlationId,
      createdAt: new Date(),
      deposit,
    });

    it(`should create DEPOSITED ledger outbox event`, () => {
      const event = LedgerOutboxEntity.deposited(entity);

      expect(event.aggregateId).toBe(entity.id);
      expect(version(event.aggregateId)).toBe(7);
      expect(event.correlationId).toBe(entity.correlationId);
      expect(version(event.correlationId)).toBe(7);
      expect(event.eventType).toBe(LedgerEventType.DEPOSITED);
      expect(event.payload).toMatchObject<DepositedLedgerPayload>({
        userId: entity.userId,
        amount: entity.amount,
      });
    });

    it(`should throw InvalidLedgerEntryTypeError for non deposit ledger entry`, () => {
      expect(() =>
        LedgerOutboxEntity.deposited({
          ...entity,
          entryType: LedgerEntryType.WITHDRAWAL,
        }),
      ).toThrow(InvalidLedgerEntryTypeError);
    });
  });

  describe('withdrawn', () => {
    const withdrawalValue = new WithdrawalValue(123);
    const entity = LedgerEntryEntity.withdrawal({
      userId,
      correlationId,
      createdAt: new Date(),
      withdrawal: withdrawalValue,
    });

    it(`should create WITHDRAWN ledger outbox event`, () => {
      const event = LedgerOutboxEntity.withdrawn(entity);

      expect(event.aggregateId).toBe(entity.id);
      expect(version(event.aggregateId)).toBe(7);
      expect(event.correlationId).toBe(correlationId);
      expect(version(event.correlationId)).toBe(7);
      expect(event.eventType).toBe(LedgerEventType.WITHDRAWN);
      expect(event.payload).toMatchObject<WithdrawnLedgerPayload>({
        userId: entity.userId,
        amount: entity.amount,
      });
    });
  });
});
