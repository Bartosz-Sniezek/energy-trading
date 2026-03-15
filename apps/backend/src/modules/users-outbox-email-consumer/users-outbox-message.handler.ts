import { EachMessagePayload } from '@confluentinc/kafka-javascript/types/kafkajs';
import { MessageHandler } from '@modules/kafka/message-handler.interface';
import { Inject, Injectable } from '@nestjs/common';
import { DebeziumConnectorMessageParser } from './debezium-connector-message.parser';
import { EventMapperRegistry } from './event-mapper-registry';
import { MAIL_SERVICE } from '@technical/mailing/constants';
import type { MailService } from '@technical/mailing/interfaces/mail-service';

@Injectable()
export class UsersOutboxMessageHandler implements MessageHandler {
  constructor(
    private readonly messageParser: DebeziumConnectorMessageParser,
    private readonly eventMapperRegistry: EventMapperRegistry,
    @Inject(MAIL_SERVICE)
    private readonly mailService: MailService,
  ) {}

  async handleMessage(messagePayload: EachMessagePayload): Promise<void> {
    const event = this.messageParser.parse(messagePayload.message);
    const mapper = this.eventMapperRegistry.getMapper(event);
    const parsedEvent = mapper.parse(event);
    const template = mapper.createTemplate(parsedEvent);

    await this.mailService.send({
      to: template.to,
      subject: template.subject,
      html: template.html,
    });
  }
}
