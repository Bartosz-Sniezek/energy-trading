import { KafkaJS } from '@confluentinc/kafka-javascript';
import { Inject, Injectable } from '@nestjs/common';
import { KAFKA_SERVICE } from './kafka.module';
import { EachMessageHandler } from '@confluentinc/kafka-javascript/types/kafkajs';

export interface ConsumerFactoryCreateOptions {
  config: KafkaJS.ConsumerConstructorConfig;
  topics: KafkaJS.ConsumerSubscribeTopics;
  messageHandler: EachMessageHandler;
}

@Injectable()
export class ConsumerFactory {
  constructor(@Inject(KAFKA_SERVICE) private readonly kafka: KafkaJS.Kafka) {}

  async create(
    options: ConsumerFactoryCreateOptions,
  ): Promise<KafkaJS.Consumer> {
    const consumer = this.kafka.consumer(options.config);
    await consumer.connect();
    await consumer.subscribe(options.topics);

    await consumer.run({
      eachMessage: async (payload) => await options.messageHandler(payload),
    });

    return consumer;
  }
}
