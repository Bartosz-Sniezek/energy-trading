import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { RefreshToken, RefreshTokenId } from '@domain/auth/types';
import type { UserId } from '@modules/users/types';
import { v7 } from 'uuid';

export interface RefreshTokenEntityCreateOptions {
  userId: UserId;
  token: RefreshToken;
  expirationDate: Date;
  createdAt: Date;
}

@Entity('refresh_tokens')
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  readonly id: RefreshTokenId;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  readonly userId: UserId;

  @Column({ name: 'token', unique: true })
  readonly token: RefreshToken;

  @Column({ name: 'expiration_date', type: 'timestamp' })
  readonly expirationDate: Date;

  @Column({ name: 'created_at', type: 'timestamp with time zone' })
  readonly createdAt: Date;

  static create(options: RefreshTokenEntityCreateOptions): RefreshTokenEntity {
    return Object.assign(new RefreshTokenEntity(), <RefreshTokenEntity>{
      id: v7(),
      userId: options.userId,
      token: options.token,
      expirationDate: options.expirationDate,
      createdAt: options.createdAt,
    });
  }
}
