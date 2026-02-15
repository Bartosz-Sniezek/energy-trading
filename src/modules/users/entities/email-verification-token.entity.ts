import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { EmailVerificationTokenId, UserId } from '../types';

@Entity('email_verification_tokens')
@Index(['token'])
@Index(['expiresAt'])
export class EmailVerificationTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  readonly id: EmailVerificationTokenId;

  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId: UserId;

  @Column({
    name: 'token',
    type: 'varchar',
  })
  token: string;

  @Column({
    name: 'expires_at',
    type: 'timestamp with time zone',
  })
  expiresAt: Date;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  createdAt: Date;
}
