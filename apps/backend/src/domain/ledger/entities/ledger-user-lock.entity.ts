import type { UserId } from '@domain/users/types';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('ledger_user_locks')
export class LedgerUserLockEntity {
  @PrimaryColumn('uuid', { name: 'user_id' })
  readonly userId: UserId;

  @Column({ name: 'created_at', type: 'timestamptz' })
  readonly createdAt: Date;

  static create(userId: UserId, createdAt: Date): LedgerUserLockEntity {
    return Object.assign(new LedgerUserLockEntity(), {
      userId,
      createdAt,
    });
  }
}
