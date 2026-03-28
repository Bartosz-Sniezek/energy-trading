import { EachMessagePayload } from '@confluentinc/kafka-javascript/types/kafkajs';
import { MessageHandler } from '@modules/kafka/message-handler.interface';
import { Injectable } from '@nestjs/common';
import { DebeziumConnectorMessageParser } from '../../common/kafka/debezium-connector-message.parser';
import { UserAccountCreatedEventMapper } from './event-mappers/user-account-created.event-mapper';
import { UserEvents } from '@domain/users/events.enum';

@Injectable()
export class LedgerUsersOutboxMessageHandler implements MessageHandler {
  constructor(
    private readonly messageParser: DebeziumConnectorMessageParser,
    private readonly userAccountCreatedEventMapper: UserAccountCreatedEventMapper,
  ) {}

  async handleMessage(messagePayload: EachMessagePayload): Promise<void> {
    const event = this.messageParser.parse(messagePayload.message);

    if (event.eventType !== UserEvents.USER_ACCOUNT_REGISTERED) return;

    const parsedEvent = this.userAccountCreatedEventMapper.parse(event);

    await this.userAccountCreatedEventMapper.execute(parsedEvent);
  }
}
