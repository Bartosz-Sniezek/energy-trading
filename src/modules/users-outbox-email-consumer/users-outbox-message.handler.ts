import { EachMessagePayload } from '@confluentinc/kafka-javascript/types/kafkajs';
import { MessageHandler } from '@modules/kafka/message-handler.interface';
import { Injectable } from '@nestjs/common';
import { DebeziumConnectorMessageParser } from './debezium-connector-message.parser';
import { EventHandlerRegistry } from './event-handler-registry';

@Injectable()
export class UsersOutboxMessageHandler implements MessageHandler {
  constructor(
    private readonly messageParser: DebeziumConnectorMessageParser,
    private readonly eventHandlerRegistry: EventHandlerRegistry,
  ) {}

  async handleMessage(messagePayload: EachMessagePayload): Promise<void> {
    const event = await this.messageParser.parse(messagePayload.message);
    await this.eventHandlerRegistry.handle(event);
  }
}
