import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { UserId } from '../types';

@Entity('users')
@Index(['email'])
@Index(['isActive'])
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
  passwordHash: string;

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
