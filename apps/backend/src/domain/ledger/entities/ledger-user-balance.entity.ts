import type { UserId } from '@domain/users/types';
import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('ledger_users_balances')
export class LedgerUserBalanceEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  readonly userId: UserId;

  @Column({
    name: 'available',
    type: 'numeric',
    precision: 18,
    scale: 6,
    default: 0,
  })
  readonly available: string;

  @Column({
    name: 'locked',
    type: 'numeric',
    precision: 18,
    scale: 6,
    default: 0,
  })
  readonly locked: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  readonly updatedAt: Date;

  static create(userId: UserId): LedgerUserBalanceEntity {
    return Object.assign(new LedgerUserBalanceEntity(), {
      userId,
      available: '0.000000',
      locked: '0.000000',
    });
  }
}
