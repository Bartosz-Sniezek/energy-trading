import { OutboxEntity } from 'src/common/abstract/outbox.entity';
import { Entity } from 'typeorm';

@Entity('users_outbox')
export class UserOutboxEntity extends OutboxEntity<string> {}
