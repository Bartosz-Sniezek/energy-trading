import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {
  LedgerEntryDirection,
  LedgerEntryType,
  type LedgerEntryId,
} from '../types';
import type { Nullable } from '@utils/nullable';
import type { UserId } from '@domain/users/types';
import { v7 } from 'uuid';
import { OrderId } from '@domain/orders/types';
import { TradeId } from '@domain/trades/types';
import { MinorUnitValue } from '../value-objects/minor-unit-value';

export type BalanceOperationOptions = {
  correlationId: string;
  userId: UserId;
  createdAt: Date;
  value: MinorUnitValue;
};

@Entity('ledger_entries')
export class LedgerEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  readonly id: LedgerEntryId;

  @Column({ name: 'correlation_id', type: 'uuid' })
  readonly correlationId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  readonly userId: UserId;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  readonly orderId: Nullable<OrderId> = null;

  @Column({ name: 'trade_id', type: 'uuid', nullable: true })
  readonly tradeId: Nullable<TradeId> = null;

  @Column({ name: 'entry_type', type: 'varchar' })
  readonly entryType: LedgerEntryType;

  @Column({ name: 'amount', type: 'numeric' })
  readonly amount: string;

  @Column({ name: 'direction', type: 'varchar' })
  readonly direction: LedgerEntryDirection;

  @Column({ name: 'idempotency_key', type: 'uuid', unique: true })
  readonly idempotencyKey: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  readonly createdAt: Date;

  static deposit(options: BalanceOperationOptions): LedgerEntryEntity {
    return Object.assign(new LedgerEntryEntity(), {
      id: v7(),
      correlationId: options.correlationId,
      userId: options.userId,
      entryType: LedgerEntryType.DEPOSIT,
      direction: LedgerEntryDirection.CREDIT,
      amount: options.value.toLedgerFormat(),
      idempotencyKey: v7(),
      createdAt: options.createdAt,
    });
  }

  static withdrawal(options: BalanceOperationOptions): LedgerEntryEntity {
    return Object.assign(new LedgerEntryEntity(), {
      id: v7(),
      correlationId: options.correlationId,
      userId: options.userId,
      entryType: LedgerEntryType.WITHDRAWAL,
      direction: LedgerEntryDirection.DEBIT,
      amount: options.value.toLedgerFormat(),
      idempotencyKey: v7(),
      createdAt: options.createdAt,
    });
  }
}
