import { DebeziumOutboxMessage } from '@common/kafka/debezium-connector-message.parser';

export abstract class BaseEventMapper<T> {
  abstract parse(event: DebeziumOutboxMessage): T;
}
