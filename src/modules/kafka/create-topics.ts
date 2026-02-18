import { KafkaJS } from '@confluentinc/kafka-javascript';

export interface CreateTopticOptions {
  timeout?: number | undefined;
  kafka: KafkaJS.Kafka;
  topics: KafkaJS.ITopicConfig[];
}

export const createTopics = async (
  options: CreateTopticOptions,
): Promise<void> => {
  const admin = options.kafka.admin();
  await admin.connect();
  await admin.createTopics({
    topics: options.topics,
    timeout: options.timeout,
  });
  await admin.disconnect();
};
