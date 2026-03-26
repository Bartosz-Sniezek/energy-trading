import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { LedgerEntryType, type LedgerId, LedgerReferenceType } from '../types';
import type { Nullable } from '@utils/nullable';
import type { UserId } from '@modules/users/types';
import { v7 } from 'uuid';
import { InvalidDepositValueError } from '../errors/invalid-deposit-value.error';
import { InvalidWithdrawalValueError } from '../errors/invalid-withdrawal-value.error';

export type DepositLedgerOptions = {
  correlationId: string;
  userId: UserId;
  amount: number;
  runningBalance: number;
  createdAt: Date;
  description?: string;
};

export type WithdrawalLedgerOptions = {
  correlationId: string;
  userId: UserId;
  amount: number;
  runningBalance: number;
  createdAt: Date;
  description?: string;
};

@Entity('ledger')
export class LedgerEntity {
  @PrimaryGeneratedColumn('uuid')
  readonly id: LedgerId;

  @Column({ name: 'correlation_id', type: 'uuid' })
  readonly correlationId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  readonly userId: UserId;

  @Column({ name: 'entry_type', type: 'text' })
  readonly entryType: LedgerEntryType;

  @Column({ name: 'amount', type: 'numeric' })
  readonly amount: number;

  @Column({ name: 'running_balance', type: 'numeric' })
  readonly runningBalance: number;

  @Column({ name: 'reference_type', type: 'text', nullable: true })
  readonly referenceType: Nullable<LedgerReferenceType> = null;

  @Column({ name: 'reference_id', type: 'text', nullable: true })
  readonly referenceId: Nullable<string> = null;

  @Column({ name: 'description', type: 'text', nullable: true })
  readonly description: Nullable<string> = null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  readonly createdAt: Date;

  static deposit(options: DepositLedgerOptions): LedgerEntity {
    if (options.amount <= 0) throw new InvalidDepositValueError(options.amount);

    return Object.assign(new LedgerEntity(), {
      id: v7(),
      correlationId: options.correlationId,
      userId: options.userId,
      entryType: LedgerEntryType.DEPOSIT,
      amount: options.amount,
      runningBalance: options.runningBalance,
      description: options.description ?? `Deposit: ${options.amount}`,
      createdAt: options.createdAt,
    });
  }

  static withdrawal(options: DepositLedgerOptions): LedgerEntity {
    if (options.amount <= 0)
      throw new InvalidWithdrawalValueError(options.amount);

    return Object.assign(new LedgerEntity(), {
      id: v7(),
      correlationId: options.correlationId,
      userId: options.userId,
      entryType: LedgerEntryType.WITHDRAWAL,
      amount: options.amount,
      runningBalance: options.runningBalance,
      description: options.description ?? `Withdrawal: ${options.amount}`,
      createdAt: options.createdAt,
    });
  }
}
