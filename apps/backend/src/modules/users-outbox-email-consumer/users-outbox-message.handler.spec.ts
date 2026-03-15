import { mock, mockReset } from 'vitest-mock-extended';
import { UsersOutboxMessageHandler } from './users-outbox-message.handler';
import {
  DebeziumConnectorMessageParser,
  DebeziumOutboxMessage,
} from './debezium-connector-message.parser';
import { EachMessagePayload } from '@confluentinc/kafka-javascript/types/kafkajs';
import { EventMapperRegistry } from './event-mapper-registry';
import { MailService } from '@technical/mailing/interfaces/mail-service';
import { UserEvents } from '@domain/users/events.enum';
import { randomUUID } from 'crypto';
import { randomEmail } from 'test/faker/random-email';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { v7 } from 'uuid';
import { UserAccountActivationTokenResendRequestedEvent } from './events/user-account-activation-token-resend-requested.event';
import { EventMapper } from './interfaces/event-mapper';
import { EmailTemplate } from './interfaces/email-template.strategy';

describe(UsersOutboxMessageHandler.name, () => {
  const messageParserMock = mock<DebeziumConnectorMessageParser>();
  const eventMapperRegistryMock = mock<EventMapperRegistry>();
  const mailServiceMock = mock<MailService>();
  const messageHandler = new UsersOutboxMessageHandler(
    messageParserMock,
    eventMapperRegistryMock,
    mailServiceMock,
  );
  const kafkaMessagePayloadMock = mock<EachMessagePayload>();

  beforeEach(() => {
    mockReset(messageParserMock);
    mockReset(eventMapperRegistryMock);
    mockReset(kafkaMessagePayloadMock);
    mockReset(mailServiceMock);
  });

  describe(UsersOutboxMessageHandler.prototype.handleMessage.name, () => {
    it('should process message', async () => {
      const message: DebeziumOutboxMessage = {
        id: v7(),
        aggregateId: v7(),
        timestamp: new Date().toISOString(),
        eventType: UserEvents.ACTIVATION_TOKEN_RESEND_REQUESTED,
        payload: {
          email: randomEmail().getValue(),
          firstName: randomFirstName(),
          lastName: randomLastName(),
          activationToken: randomUUID(),
          activationTokenExpirationDate: new Date().toISOString(),
        },
      };
      const event =
        UserAccountActivationTokenResendRequestedEvent.parse(message);
      const emailTemplate: EmailTemplate = {
        to: [event.email],
        subject: 'subject',
        html: 'html',
        text: 'text',
      };

      const mapperMock = mock<EventMapper<unknown>>();
      mapperMock.parse.mockReturnValue(event);
      mapperMock.createTemplate.mockReturnValue(emailTemplate);

      messageParserMock.parse.mockReturnValue(message);
      eventMapperRegistryMock.getMapper.mockReturnValue(mapperMock);

      await messageHandler.handleMessage(kafkaMessagePayloadMock);

      expect(messageParserMock.parse).toHaveBeenCalledOnce();
      expect(messageParserMock.parse).toHaveBeenCalledWith(
        kafkaMessagePayloadMock.message,
      );
      expect(eventMapperRegistryMock.getMapper).toHaveBeenCalledWith(message);
      expect(mapperMock.parse).toHaveBeenCalledWith(message);
      expect(mapperMock.createTemplate).toHaveBeenCalledWith(event);
      expect(mailServiceMock.send).toHaveBeenCalledWith({
        to: emailTemplate.to,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });
    });
  });
});
