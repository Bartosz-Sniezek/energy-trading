import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {
  LedgerEntryDirection,
  LedgerEntryType,
  type LedgerEntryId,
} from '../types';
import type { Nullable } from '@utils/nullable';
import type { UserId } from '@modules/users/types';
import { v7 } from 'uuid';
import { DepositValue } from '../value-objects/deposit-value';
import { WithdrawalValue } from '../value-objects/withdrawal-value';
import { OrderId } from '@domain/orders/types';
import { TradeId } from '@domain/trades/types';

type BaseLedgerOptions = {
  correlationId: string;
  userId: UserId;
  createdAt: Date;
};

export type DepositLedgerOptions = BaseLedgerOptions & {
  deposit: DepositValue;
};

export type WithdrawalLedgerOptions = BaseLedgerOptions & {
  withdrawal: WithdrawalValue;
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

  static deposit(options: DepositLedgerOptions): LedgerEntryEntity {
    return Object.assign(new LedgerEntryEntity(), {
      id: v7(),
      correlationId: options.correlationId,
      userId: options.userId,
      entryType: LedgerEntryType.DEPOSIT,
      direction: LedgerEntryDirection.CREDIT,
      amount: options.deposit.toString(),
      idempotencyKey: v7(),
      createdAt: options.createdAt,
    });
  }

  static withdrawal(options: WithdrawalLedgerOptions): LedgerEntryEntity {
    return Object.assign(new LedgerEntryEntity(), {
      id: v7(),
      correlationId: options.correlationId,
      userId: options.userId,
      entryType: LedgerEntryType.WITHDRAWAL,
      direction: LedgerEntryDirection.DEBIT,
      amount: options.withdrawal.toString(),
      idempotencyKey: v7(),
      createdAt: options.createdAt,
    });
  }
}
