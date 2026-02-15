import type { Nullable } from '@utils/nullable';
import { Column, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

export abstract class OutboxEntity<TEvent extends string> {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'aggregate_id',
    type: 'uuid',
  })
  aggregateId: string;

  @Column({
    name: 'event_type',
    type: 'varchar',
  })
  eventType: TEvent;

  @Column({
    name: 'payload',
    type: 'jsonb',
  })
  payload: unknown;

  @Column({
    name: 'processed',
    type: 'boolean',
    default: false,
  })
  processed: boolean;

  @Column({
    name: 'processed_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  processedAt: Nullable<Date>;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  createdAt: Date;
}
