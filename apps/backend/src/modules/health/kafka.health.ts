import { KafkaJS } from '@confluentinc/kafka-javascript';
import { KAFKA_SERVICE } from '@modules/kafka/constants';
import { Inject, Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';

@Injectable()
export class KafkaHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject(KAFKA_SERVICE) private readonly kafkaService: KafkaJS.Kafka,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const admin = this.kafkaService.admin({
      log_level: 0,
    });

    try {
      await admin.connect();
      const topics = await admin.listTopics({ timeout: 5000 });
      const metadata = await admin
        .fetchTopicMetadata({
          timeout: 5000,
        })
        .then((data) => data as unknown as KafkaJS.ITopicMetadata[]);
      await admin.disconnect();

      const totalPartitions = metadata.reduce(
        (sum, topic) => sum + topic.partitions.length,
        0,
      );

      const brokers = new Set();
      metadata.forEach((topic) => {
        topic.partitions.forEach((partition) => {
          if (partition.leader !== undefined) {
            brokers.add(partition.leader);
          }
        });
      });

      return indicator.up({
        topicCount: topics.length,
        partitionCount: totalPartitions,
        brokerCount: brokers.size,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      await admin.disconnect();

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      return indicator.down({
        message: 'Kafka connection failed',
        error: errorMessage,
      });
    }
  }
}
