import { InvalidPayloadDataError } from '@common/errors/invalid-payload-data.error';
import type { UserId } from '@modules/users/types';
import { Column, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import z from 'zod';

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

  @Column({ name: 'user_id', type: 'uuid' })
  readonly userId: UserId;

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

  protected static parsePayload<T extends z.ZodType>(
    schema: T,
    payloadData: unknown,
  ): z.infer<T> {
    const { success, data, error } = schema.safeParse(payloadData);

    if (!success) {
      throw new InvalidPayloadDataError(error.flatten().fieldErrors);
    }

    return data;
  }
}
