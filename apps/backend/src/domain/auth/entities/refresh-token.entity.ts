import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { RefreshTokenHash, RefreshTokenId } from '@domain/auth/types';
import type { UserId } from '@domain/users/types';
import { v7 } from 'uuid';
import type { Nullable } from '@utils/nullable';

export interface RefreshTokenEntityCreateOptions {
  userId: UserId;
  tokenHash: RefreshTokenHash;
  family: string;
  expiresAt: Date;
  createdAt: Date;
}

@Entity('refresh_tokens')
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  readonly id: RefreshTokenId;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  readonly userId: UserId;

  @Column({ name: 'token', type: 'text', unique: true })
  readonly tokenHash: RefreshTokenHash;

  @Column({ name: 'family', type: 'uuid' })
  readonly family: string;

  @Column({ name: 'replaced_by', type: 'uuid', nullable: true })
  replacedBy: Nullable<RefreshTokenId>;

  @Column({
    name: 'revoked_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  revokedAt: Nullable<Date>;

  @Column({ name: 'expires_at', type: 'timestamp with time zone' })
  readonly expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  readonly createdAt: Date;

  static create(options: RefreshTokenEntityCreateOptions): RefreshTokenEntity {
    return Object.assign(new RefreshTokenEntity(), <RefreshTokenEntity>{
      id: v7(),
      userId: options.userId,
      tokenHash: options.tokenHash,
      family: options.family,
      replacedBy: null,
      revokedAt: null,
      expiresAt: options.expiresAt,
      createdAt: options.createdAt,
    });
  }

  isReplaced(): boolean {
    return this.replacedBy !== null;
  }

  isRevoked(): boolean {
    return this.revokedAt !== null;
  }
}
