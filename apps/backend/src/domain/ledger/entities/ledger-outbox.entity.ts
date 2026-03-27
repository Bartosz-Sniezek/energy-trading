import { OutboxEntity } from '@common/abstract/outbox.entity';
import { Entity } from 'typeorm';
import {
  DepositedLedgerPayload,
  depositedLedgerPayloadSchema,
  LedgerEntryType,
  LedgerEventType,
  LedgerOutboxPayload,
  WithdrawnLedgerPayload,
  withdrawnLedgerPayloadSchema,
} from '../types';
import type { UserId } from '@modules/users/types';
import z from 'zod';
import { LedgerEntryEntity } from './ledger.entity';
import { InvalidLedgerEntryTypeError } from '../errors/invalid-ledger-entry-type.error';

@Entity('ledger_outbox')
export class LedgerOutboxEntity extends OutboxEntity<
  LedgerEventType,
  LedgerOutboxPayload
> {
  private static createOutboxEvent(
    userId: UserId,
    aggregateId: string,
    correlationId: string,
    eventType: LedgerEventType,
    schema: z.ZodType,
    payload: unknown,
  ): LedgerOutboxEntity {
    return Object.assign(new this(), {
      aggregateId,
      correlationId,
      userId,
      eventType,
      payload: OutboxEntity.parsePayload(schema, payload),
    });
  }

  static deposited(ledgerEntry: LedgerEntryEntity): LedgerOutboxEntity {
    if (ledgerEntry.entryType !== LedgerEntryType.DEPOSIT)
      throw new InvalidLedgerEntryTypeError(ledgerEntry.entryType);

    return LedgerOutboxEntity.createOutboxEvent(
      ledgerEntry.userId,
      ledgerEntry.id,
      ledgerEntry.correlationId,
      LedgerEventType.DEPOSITED,
      depositedLedgerPayloadSchema,
      <DepositedLedgerPayload>{
        userId: ledgerEntry.userId,
        amount: ledgerEntry.amount,
      },
    );
  }

  static withdrawn(ledgerEntry: LedgerEntryEntity): LedgerOutboxEntity {
    if (ledgerEntry.entryType !== LedgerEntryType.WITHDRAWAL)
      throw new InvalidLedgerEntryTypeError(ledgerEntry.entryType);

    return LedgerOutboxEntity.createOutboxEvent(
      ledgerEntry.userId,
      ledgerEntry.id,
      ledgerEntry.correlationId,
      LedgerEventType.WITHDRAWN,
      withdrawnLedgerPayloadSchema,
      <WithdrawnLedgerPayload>{
        userId: ledgerEntry.userId,
        amount: ledgerEntry.amount,
      },
    );
  }
}
