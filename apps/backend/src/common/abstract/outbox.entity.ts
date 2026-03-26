import { Column, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

export abstract class OutboxEntity<
  TEvent extends string,
  TPayload extends object,
> {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'correlation_id',
    type: 'uuid',
  })
  correlationId: string;

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
  payload: TPayload;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  createdAt: Date;
}
