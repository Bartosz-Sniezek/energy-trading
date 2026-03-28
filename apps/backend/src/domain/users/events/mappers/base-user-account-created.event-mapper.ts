import { Injectable } from '@nestjs/common';
import { UserAccountCreatedEvent } from '@domain/users/events/user-account-created.event';
import { BaseEventMapper } from './base-event-mapper';
import { DebeziumOutboxMessage } from '@common/kafka/debezium-connector-message.parser';

@Injectable()
export class BaseUserAccountCreatedEventMapper extends BaseEventMapper<UserAccountCreatedEvent> {
  parse(event: DebeziumOutboxMessage): UserAccountCreatedEvent {
    return UserAccountCreatedEvent.parse(event);
  }
}
