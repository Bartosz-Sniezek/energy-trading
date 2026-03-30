import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Hash, UserId } from '../types';
import { Email } from '@domain/users/value-objects/email';
import { v7 } from 'uuid';

export interface CreateUserOptions {
  email: Email;
  passwordHash: Hash;
  firstName: string;
  lastName: string;
  activationToken: string;
  activationTokenExpiresAt: Date;
  createdAt: Date;
}

@Entity('users')
@Index(['email'])
@Index(['isActive'])
@Index(['activationToken'])
@Index(['activationTokenExpiresAt'])
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  readonly id: UserId;

  @Column({
    name: 'email',
    type: 'varchar',
    unique: true,
  })
  email: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
  })
  passwordHash: Hash;

  @Column({
    name: 'first_name',
    type: 'varchar',
  })
  firstName: string;

  @Column({
    name: 'last_name',
    type: 'varchar',
  })
  lastName: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: false,
  })
  isActive: boolean;

  @Column({
    name: 'activation_token',
    type: 'varchar',
    unique: true,
  })
  activationToken: string;

  @Column({
    name: 'activation_token_expires_at',
    type: 'timestamp with time zone',
  })
  activationTokenExpiresAt: Date;

  @Column({
    name: 'balance',
    type: 'numeric',
    default: 0,
  })
  balance: number = 0;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
  })
  updatedAt: Date;

  static create(options: CreateUserOptions): UserEntity {
    return Object.assign(new UserEntity(), {
      id: v7(),
      email: options.email.getValue(),
      passwordHash: options.passwordHash,
      firstName: options.firstName,
      lastName: options.lastName,
      balance: 0,
      isActive: false,
      activationToken: options.activationToken,
      activationTokenExpiresAt: options.activationTokenExpiresAt,
      createdAt: options.createdAt,
      updatedAt: options.createdAt,
    });
  }
}
