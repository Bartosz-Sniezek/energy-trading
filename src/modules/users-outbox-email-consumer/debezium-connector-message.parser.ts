import { KafkaJS } from '@confluentinc/kafka-javascript';
import { Injectable } from '@nestjs/common';
import z from 'zod';

const debeziumMessageSchema = z.object({
  id: z.string(),
  aggregateId: z.string(),
  eventType: z.string(),
  timestamp: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

export type DebeziumOutboxMessage = z.infer<typeof debeziumMessageSchema>;

@Injectable()
export class DebeziumConnectorMessageParser {
  parse(message: KafkaJS.Message): DebeziumOutboxMessage {
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

    const eventRawData = <DebeziumOutboxMessage>{
      id,
      aggregateId,
      eventType,
      timestamp: message.timestamp,
      payload,
    };
    const { data, error } = debeziumMessageSchema.safeParse(eventRawData);

    if (error) {
      throw new Error('Invalid payload');
    }

    return data;
  }

  private parseJSON(data: string): Record<string, unknown> {
    return JSON.parse(data) as Record<string, unknown>;
  }
}
