import { KafkaJS } from '@confluentinc/kafka-javascript';
import { Injectable } from '@nestjs/common';
import z from 'zod';
import { InvalidMessagePermanentError } from './errors/invalid-message.permanent-error';

const debeziumMessageSchema = z.object({
  id: z.string(),
  correlationId: z.uuidv7(),
  aggregateId: z.string(),
  userId: z.uuidv7(),
  eventType: z.string(),
  timestamp: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

export type DebeziumOutboxMessage = z.infer<typeof debeziumMessageSchema>;

@Injectable()
export class DebeziumConnectorMessageParser {
  parse(message: KafkaJS.Message): DebeziumOutboxMessage {
    try {
      const key = message.key ? this.parseJSON(message.key.toString()) : null;
      const value = message.value
        ? this.parseJSON(message.value.toString())
        : null;
      const payload =
        value?.['payload'] && typeof value['payload'] === 'string'
          ? this.parseJSON(value['payload'])
          : null;

      const id = message.headers?.['id']?.toString();
      const aggregateId = key?.['payload'];
      const eventType = message.headers?.['event_type']?.toString();
      const correlationId = message.headers?.['correlation_id']?.toString();
      const userId = message.headers?.['user_id']?.toString();

      const eventRawData = <DebeziumOutboxMessage>{
        id,
        correlationId,
        userId,
        aggregateId,
        eventType,
        timestamp: message.timestamp,
        payload,
      };
      const data = debeziumMessageSchema.parse(eventRawData);

      return data;
    } catch {
      throw new InvalidMessagePermanentError(message);
    }
  }

  private parseJSON(data: string): Record<string, unknown> {
    return JSON.parse(data) as Record<string, unknown>;
  }
}
