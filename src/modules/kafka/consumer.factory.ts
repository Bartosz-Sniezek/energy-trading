import { KafkaJS } from '@confluentinc/kafka-javascript';
import { Inject, Injectable } from '@nestjs/common';
import { KAFKA_SERVICE } from './constants';
import { EachMessageHandler } from '@confluentinc/kafka-javascript/types/kafkajs';
import { createTopics } from './create-topics';

export interface ConsumerFactoryCreateOptions {
  config: KafkaJS.ConsumerConstructorConfig;
  topics: KafkaJS.ConsumerSubscribeTopics;
  createTopics?: KafkaJS.ITopicConfig[];
  messageHandler: EachMessageHandler;
}

@Injectable()
export class ConsumerFactory {
  constructor(@Inject(KAFKA_SERVICE) private readonly kafka: KafkaJS.Kafka) {}

  async create(
    options: ConsumerFactoryCreateOptions,
  ): Promise<KafkaJS.Consumer> {
    if (options.createTopics) {
      await createTopics({
        kafka: this.kafka,
        topics: options.createTopics,
      });
    }

    const consumer = this.kafka.consumer(options.config);
    await consumer.connect();
    await consumer.subscribe(options.topics);

    await consumer.run({
      eachMessage: async (payload) => await options.messageHandler(payload),
    });

    return consumer;
  }
}
