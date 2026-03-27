import z from 'zod';
import { InvalidPayloadDataError } from '@common/errors/invalid-payload-data.error';
import { InvalidEventTypeError } from '@common/errors/invalid-event-type.error';
import { ledgerAmountSchema, LedgerEventType } from '../types';
import { DebeziumOutboxMessage } from '@common/kafka/debezium-connector-message.parser';

export const depositedLedgerEntryEventSchema = z.object({
  id: z.uuidv7(),
  correlationId: z.uuidv7(),
  userId: z.uuidv7(),
  amount: ledgerAmountSchema,
  timestamp: z.string().transform((data) => parseInt(data)),
});

export type TDepositedLedgerEntryEvent = z.infer<
  typeof depositedLedgerEntryEventSchema
>;

export class DepositedLedgerEntryEvent implements TDepositedLedgerEntryEvent {
  readonly __type: LedgerEventType.DEPOSITED;
  readonly id: string;
  readonly correlationId: string;
  readonly userId: string;
  readonly amount: string;
  readonly timestamp: number;

  private constructor(options: TDepositedLedgerEntryEvent) {
    Object.assign(this, options);
  }

  static parse(event: DebeziumOutboxMessage): DepositedLedgerEntryEvent {
    if (event.eventType !== LedgerEventType.DEPOSITED) {
      throw new InvalidEventTypeError(event.eventType);
    }

    const payload = event.payload;
    const { data, error } = depositedLedgerEntryEventSchema.safeParse({
      id: event.id,
      correlationId: event.correlationId,
      userId: event.userId,
      amount: payload?.['amount'],
      timestamp: event.timestamp,
    });

    if (error) throw new InvalidPayloadDataError(error.flatten().fieldErrors);

    return new DepositedLedgerEntryEvent(data);
  }
}
