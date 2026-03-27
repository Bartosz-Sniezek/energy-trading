import { DebeziumOutboxMessage } from '../../../common/kafka/debezium-connector-message.parser';

export interface UserOutboxMessageHandler {
  handle(data: DebeziumOutboxMessage): Promise<void>;
}
