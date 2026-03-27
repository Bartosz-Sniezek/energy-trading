import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { OrderId } from '../types';
import type { UserId } from '@modules/users/types';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  readonly id: OrderId;

  @Column({ name: 'correlation_id', type: 'uuid' })
  readonly correlationId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  readonly userId: UserId;

  @Column({ name: 'commodity_id', type: 'text' })
  readonly commodityId: string;

  @Column({ name: 'commodity_symbol', type: 'text' })
  readonly commoditySymbol: string;
}
