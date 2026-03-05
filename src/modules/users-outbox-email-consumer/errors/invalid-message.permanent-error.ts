import { PermanentError } from '@common/kafka/permanent.error';
import { KafkaJS } from '@confluentinc/kafka-javascript';

export class InvalidMessagePermanentError extends PermanentError {
  constructor(readonly kafkaMessage: KafkaJS.Message) {
    super(
      `Invalid message. key: ${kafkaMessage.key?.toString()} | value: ${kafkaMessage.value?.toString()} | headers: ${kafkaMessage.headers}`,
    );
  }
}
