import { EachMessagePayload } from '@confluentinc/kafka-javascript/types/kafkajs';

export interface MessageHandler {
  handleMessage(payload: EachMessagePayload): Promise<void>;
}
