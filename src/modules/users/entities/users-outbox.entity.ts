import { UserEvents } from '@domain/users/events.enum';
import { OutboxEntity } from '@common/abstract/outbox.entity';
import { Entity } from 'typeorm';

export interface UserOutboxPayload {
  email: string;
  firstName: string;
  lastName: string;
}

@Entity('users_outbox')
export class UserOutboxEntity extends OutboxEntity<
  UserEvents,
  UserOutboxPayload
> {}
