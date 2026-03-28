import { mock, mockReset } from 'vitest-mock-extended';
import { LedgerUsersOutboxMessageHandler } from './ledger-users-outbox-message.handler';
import {
  DebeziumConnectorMessageParser,
  DebeziumOutboxMessage,
} from '../../common/kafka/debezium-connector-message.parser';
import { EachMessagePayload } from '@confluentinc/kafka-javascript/types/kafkajs';
import { UserEvents } from '@domain/users/events.enum';
import { randomUUID } from 'crypto';
import { randomEmail } from 'test/faker/random-email';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { v7 } from 'uuid';
import { randomCorrelationId } from 'test/faker/random-correlation-id';
import { randomUserId } from 'test/faker/random-user-id';
import { UserAccountCreatedEventMapper } from './event-mappers/user-account-created.event-mapper';
import { UserAccountCreatedEvent } from '@domain/users/events/user-account-created.event';

describe('LedgerUsersOutboxMessageHandler', () => {
  const messageParserMock = mock<DebeziumConnectorMessageParser>();
  const userAccountCreatedEventMapperMock =
    mock<UserAccountCreatedEventMapper>();
  const messageHandler = new LedgerUsersOutboxMessageHandler(
    messageParserMock,
    userAccountCreatedEventMapperMock,
  );
  const kafkaMessagePayloadMock = mock<EachMessagePayload>();

  beforeEach(() => {
    mockReset(messageParserMock);
    mockReset(userAccountCreatedEventMapperMock);
    mockReset(kafkaMessagePayloadMock);
  });

  describe('handleMessage', () => {
    it('should process USER_ACCOUNT_REGISTERED message', async () => {
      const userId = randomUserId();
      const message: DebeziumOutboxMessage = {
        id: v7(),
        userId,
        correlationId: randomCorrelationId(),
        aggregateId: userId,
        timestamp: new Date().toISOString(),
        eventType: UserEvents.USER_ACCOUNT_REGISTERED,
        payload: {
          email: randomEmail().getValue(),
          firstName: randomFirstName(),
          lastName: randomLastName(),
          activationToken: randomUUID(),
          activationTokenExpirationDate: new Date().toISOString(),
        },
      };
      const event = UserAccountCreatedEvent.parse(message);

      messageParserMock.parse.mockReturnValue(message);
      userAccountCreatedEventMapperMock.parse.mockReturnValue(event);

      await messageHandler.handleMessage(kafkaMessagePayloadMock);

      expect(messageParserMock.parse).toHaveBeenCalledWith(
        kafkaMessagePayloadMock.message,
      );
      expect(userAccountCreatedEventMapperMock.parse).toHaveBeenCalledWith(
        message,
      );
      expect(userAccountCreatedEventMapperMock.execute).toHaveBeenCalledWith(
        event,
      );
    });

    it('should return if event type is not USER_ACCOUNT_REGISTERED', async () => {
      const userId = randomUserId();
      const message: DebeziumOutboxMessage = {
        id: v7(),
        userId,
        correlationId: randomCorrelationId(),
        aggregateId: userId,
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

      messageParserMock.parse.mockReturnValue(message);

      await messageHandler.handleMessage(kafkaMessagePayloadMock);

      expect(messageParserMock.parse).toHaveBeenCalled();
      expect(userAccountCreatedEventMapperMock.parse).not.toHaveBeenCalled();
      expect(userAccountCreatedEventMapperMock.execute).not.toHaveBeenCalled();
    });
  });
});
