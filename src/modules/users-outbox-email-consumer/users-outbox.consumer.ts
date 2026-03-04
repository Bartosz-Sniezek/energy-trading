import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { KafkaJS } from '@confluentinc/kafka-javascript';
import { AppConfig } from '@technical/app-config/app-config';
import { GROUP_ID } from './constants';
import { commitOffset } from '@modules/kafka/commit-offset';
import { UsersOutboxMessageHandler } from './users-outbox-message.handler';
import { ConsumerFactory } from '@modules/kafka/consumer.factory';
import { EachMessagePayload } from '@confluentinc/kafka-javascript/types/kafkajs';

@Injectable()
export class UsersOutboxConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger: Logger;
  private consumer: KafkaJS.Consumer | null = null;

  constructor(
    private readonly consumerFactory: ConsumerFactory,
    private readonly appConfig: AppConfig,
    private readonly messageHandler: UsersOutboxMessageHandler,
    @Optional()
    logger?: Logger,
  ) {
    this.logger = logger ? logger : new Logger(UsersOutboxConsumer.name);
  }

  async onModuleInit(): Promise<void> {
    this.consumer = await this.consumerFactory.create({
      config: {
        'group.id': GROUP_ID,
        'session.timeout.ms': 30000,
        'heartbeat.interval.ms': 3000,
        'auto.offset.reset': 'beginning',
        'enable.auto.commit': false,
        log_level: this.appConfig.values.KAFKA_LOG_LEVEL ?? 6,
      },
      topics: {
        topics: [this.appConfig.values.KAFKA_USERS_OUTBOX_TOPIC],
      },
      createTopics: this.appConfig.isProduction()
        ? undefined
        : [
            {
              topic: this.appConfig.values.KAFKA_USERS_OUTBOX_TOPIC,
              numPartitions: 1,
              replicationFactor: 1,
            },
          ],
      messageHandler: (payload: EachMessagePayload) =>
        this.handleMessage(payload),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer?.disconnect();
  }

  private async handleMessage(
    messagePayload: KafkaJS.EachMessagePayload,
  ): Promise<void> {
    if (this.consumer == null) throw new Error('Consumer not initialized');

    this.logger.verbose(messagePayload);
    await this.messageHandler.handleMessage(messagePayload);
    await commitOffset({
      consumer: this.consumer,
      message: messagePayload.message,
      partition: messagePayload.partition,
      topic: messagePayload.topic,
    });
  }
}
