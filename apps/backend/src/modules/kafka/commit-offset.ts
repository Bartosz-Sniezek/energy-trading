import { KafkaJS } from '@confluentinc/kafka-javascript';

export interface CommitOffsetOptions {
  consumer: KafkaJS.Consumer;
  topic: string;
  partition: number;
  message: KafkaJS.KafkaMessage;
}

export const commitOffset = async ({
  consumer,
  message,
  partition,
  topic,
}: CommitOffsetOptions): Promise<void> => {
  await consumer.commitOffsets([
    {
      topic,
      partition,
      offset: (Number(message.offset) + 1).toString(),
    },
  ]);
};
