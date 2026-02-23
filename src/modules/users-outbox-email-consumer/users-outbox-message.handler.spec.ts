import { mock, mockReset } from 'vitest-mock-extended';
import { UsersOutboxMessageHandler } from './users-outbox-message.handler';
import {
  DebeziumConnectorMessageParser,
  DebeziumOutboxMessage,
} from './debezium-connector-message.parser';
import { EventHandlerRegistry } from './event-handler-registry';
import { EachMessagePayload } from '@confluentinc/kafka-javascript/types/kafkajs';

describe(UsersOutboxMessageHandler.name, () => {
  const messageParserMock = mock<DebeziumConnectorMessageParser>();
  const eventHandlerRegistryMock = mock<EventHandlerRegistry>();
  const messageHandler = new UsersOutboxMessageHandler(
    messageParserMock,
    eventHandlerRegistryMock,
  );
  const kafkaMessagePayloadMock = mock<EachMessagePayload>();

  beforeEach(() => {
    mockReset(messageParserMock);
    mockReset(eventHandlerRegistryMock);
    mockReset(kafkaMessagePayloadMock);
  });

  describe(UsersOutboxMessageHandler.prototype.handleMessage.name, () => {
    it('should parse incoming message', async () => {
      await messageHandler.handleMessage(kafkaMessagePayloadMock);

      expect(messageParserMock.parse).toHaveBeenCalledOnce();
      expect(messageParserMock.parse).toHaveBeenCalledWith(
        kafkaMessagePayloadMock.message,
      );
    });

    it('should process message with EventHandlerRegistry ', async () => {
      const debeziumEventMock = mock<DebeziumOutboxMessage>();
      messageParserMock.parse.mockReturnValue(debeziumEventMock);

      await messageHandler.handleMessage(kafkaMessagePayloadMock);

      expect(messageParserMock.parse).toHaveBeenCalledOnce();
      expect(messageParserMock.parse).toHaveBeenCalledWith(
        kafkaMessagePayloadMock.message,
      );
      expect(eventHandlerRegistryMock.handle).toHaveBeenCalledOnce();
      expect(eventHandlerRegistryMock.handle).toHaveBeenCalledWith(
        debeziumEventMock,
      );
    });
  });
});
