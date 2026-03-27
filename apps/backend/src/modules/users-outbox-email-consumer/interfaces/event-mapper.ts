import { DebeziumOutboxMessage } from '../../../common/kafka/debezium-connector-message.parser';
import { EmailTemplate } from './email-template.strategy';

export interface EventMapper<T> {
  parse(event: DebeziumOutboxMessage): T;
  createTemplate(event: T): EmailTemplate;
}
