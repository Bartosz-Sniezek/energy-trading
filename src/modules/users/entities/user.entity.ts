import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Hash, UserId } from '../types';

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
}
