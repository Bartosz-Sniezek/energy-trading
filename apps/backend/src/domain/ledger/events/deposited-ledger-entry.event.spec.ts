import { v7 } from 'uuid';
import { DebeziumOutboxMessage } from '../../../common/kafka/debezium-connector-message.parser';
import { InvalidPayloadDataError } from '@common/errors/invalid-payload-data.error';
import { InvalidEventTypeError } from '@common/errors/invalid-event-type.error';
import { randomCorrelationId } from 'test/faker/random-correlation-id';
import { randomUserId } from 'test/faker/random-user-id';
import { DepositedLedgerEntryEvent } from './deposited-ledger-entry.event';
import { DepositedLedgerPayload, LedgerEventType } from '../types';
import { MinorUnitValue } from '../value-objects/minor-unit-value';

describe('DepositedLedgerEntryEvent', () => {
  const timestamp = Date.now().toString();
  const userId = randomUserId();
  const validEventPayload: DepositedLedgerPayload = {
    amount: new MinorUnitValue(1000).toLedgerFormat(),
    userId,
  };
  const validEventData: DebeziumOutboxMessage = {
    id: v7(),
    userId,
    correlationId: randomCorrelationId(),
    aggregateId: v7(),
    eventType: LedgerEventType.DEPOSITED,
    timestamp,
    payload: validEventPayload,
  };

  describe('DepositedLedgerEntryEvent.parse', () => {
    it(`should create an event from DebeziumOutboxMessage`, () => {
      const event = DepositedLedgerEntryEvent.parse(validEventData);

      expect(event.id).toBe(validEventData.id);
      expect(event.userId).toBe(validEventData.userId);
      expect(event.correlationId).toBe(validEventData.correlationId);
      expect(event.amount).toBe('10.000000');
      expect(event.timestamp).toBe(parseInt(timestamp));
    });

    it(`should throw InvalidPayloadData when id is non-uuid string`, () => {
      expect(() =>
        DepositedLedgerEntryEvent.parse({
          ...validEventData,
          id: 'invalid-uuid',
        }),
      ).toThrow(InvalidPayloadDataError);
    });

    it(`should throw InvalidPayloadData when id UUIDv4`, () => {
      expect(() =>
        DepositedLedgerEntryEvent.parse({
          ...validEventData,
          id: '92b8e7b4-6a6b-40a1-a450-cf2f2c4a44a8',
        }),
      ).toThrow(InvalidPayloadDataError);
    });

    it(`should throw InvalidPayloadData when userId is non-uuid string`, () => {
      expect(() =>
        DepositedLedgerEntryEvent.parse({
          ...validEventData,
          userId: 'invalid-uuid',
        }),
      ).toThrow(InvalidPayloadDataError);
    });

    it(`should throw InvalidPayloadData when userId is UUIDv4`, () => {
      expect(() =>
        DepositedLedgerEntryEvent.parse({
          ...validEventData,
          userId: '92b8e7b4-6a6b-40a1-a450-cf2f2c4a44a8',
        }),
      ).toThrow(InvalidPayloadDataError);
    });

    it(`should throw InvalidEventTypeError when eventType is not LedgerEntryType.DEPOSITED`, () => {
      expect(() =>
        DepositedLedgerEntryEvent.parse({
          ...validEventData,
          eventType: 'random-string',
        }),
      ).toThrow(InvalidEventTypeError);
      expect(() =>
        DepositedLedgerEntryEvent.parse({
          ...validEventData,
          eventType: LedgerEventType.WITHDRAWN,
        }),
      ).toThrow(InvalidEventTypeError);
    });

    it(`should throw InvalidPayloadDataError when amount is not valid positive numeric value`, () => {
      expect(() =>
        DepositedLedgerEntryEvent.parse({
          ...validEventData,
          payload: {
            ...validEventPayload,
            amount: 'xd',
          },
        }),
      ).toThrow(InvalidPayloadDataError);
    });

    it(`should throw InvalidPayloadData when timestamp is not a string`, () => {
      expect(() =>
        DepositedLedgerEntryEvent.parse({
          ...validEventData,
          timestamp: undefined as any,
        }),
      ).toThrow(InvalidPayloadDataError);
    });
  });
});
