import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { KafkaJS } from '@confluentinc/kafka-javascript';
import { AppConfig } from '@technical/app-config/app-config';
import { UsersOutboxMessageHandler } from './users-outbox-message.handler';
import { KAFKA_SERVICE } from '@modules/kafka/constants';
import { PermanentError } from '@common/kafka/permanent.error';
import { createTopics } from '@modules/kafka/create-topics';

@Injectable()
export class UsersOutboxConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger: Logger;
  private consumer: KafkaJS.Consumer;
  private dlqProducer: KafkaJS.Producer;
  private readonly CONSUMER_GROUP_ID: string;
  private readonly TOPIC: string;
  private readonly DLQ_TOPIC: string;
  private readonly LOG_LEVEL: number;
  private readonly MAX_RETRIES: number;
  private readonly BASE_DELAY: number;
  private readonly CREATE_TOPICS: boolean;

  constructor(
    @Inject(KAFKA_SERVICE)
    private readonly kafka: KafkaJS.Kafka,
    appConfig: AppConfig,
    private readonly messageHandler: UsersOutboxMessageHandler,
    @Optional()
    logger?: Logger,
  ) {
    this.logger = logger ? logger : new Logger(UsersOutboxConsumer.name);
    this.CONSUMER_GROUP_ID = appConfig.values.EMAIL_NOTIFIER_CONSUMER_GROUP_ID;
    this.TOPIC = appConfig.values.KAFKA_USERS_OUTBOX_TOPIC;
    this.DLQ_TOPIC = appConfig.values.KAFKA_USERS_OUTBOX_TOPIC_DLQ;
    this.LOG_LEVEL = appConfig.values.KAFKA_LOG_LEVEL ?? 6;
    this.MAX_RETRIES = appConfig.values.EMAIL_NOTIFIER_CONSUMER_MAX_RETRIES;
    this.BASE_DELAY = appConfig.values.EMAIL_NOTIFIER_CONSUMER_RETRY_BASE_DELAY;
    this.CREATE_TOPICS = !appConfig.isProduction();

    this.consumer = this.kafka.consumer({
      'group.id': this.CONSUMER_GROUP_ID,
      'session.timeout.ms': 10000,
      'max.poll.interval.ms': 10000,
      'heartbeat.interval.ms': 7000,
      'auto.offset.reset': 'beginning',
      'enable.auto.commit': false,
      log_level: this.LOG_LEVEL,
    });
    this.dlqProducer = this.kafka.producer({
      'allow.auto.create.topics': true,
      'client.id': 'dlq-producer',
      'compression.type': 'gzip',
      log_level: this.LOG_LEVEL,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.dlqProducer.connect();
    await this.consumer.connect();

    if (this.CREATE_TOPICS) {
      await createTopics({
        kafka: this.kafka,
        topics: [{ topic: this.TOPIC }],
      });
    }

    await this.consumer.subscribe({
      topic: this.TOPIC,
    });
    await this.consumer.run({
      eachMessage: async (payload) => await this.handleMessage(payload),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
    await this.dlqProducer.disconnect();
  }

  private async sendToDlq(
    messagePayload: KafkaJS.EachMessagePayload,
    error: Error,
  ): Promise<void> {
    try {
      await this.dlqProducer.send({
        topic: this.DLQ_TOPIC,
        messages: [
          {
            key: messagePayload.message.key,
            value: messagePayload.message.value,
            headers: {
              ...messagePayload.message.headers,
              'x-error-name': Buffer.from(error.name),
              'x-error-message': Buffer.from(error.message),
              'x-error-stack': Buffer.from(error.stack || ''),
              'x-original-topic': Buffer.from(messagePayload.topic),
              'x-original-partition': Buffer.from(
                messagePayload.partition.toString(),
              ),
              'x-original-offset': Buffer.from(messagePayload.message.offset),
              'x-original-timestamp': Buffer.from(
                messagePayload.message.timestamp,
              ),
              'x-consumer-group-id': Buffer.from(this.CONSUMER_GROUP_ID),
            },
          },
        ],
      });
    } catch (error) {
      this.logger.error(`Failed to send to DLQ: ${error}`);
      throw error;
    }
  }

  private async handleMessage(
    messagePayload: KafkaJS.EachMessagePayload,
  ): Promise<void> {
    this.logger.verbose(
      `Processing message: ${messagePayload.topic} partition: ${messagePayload.partition} offset: ${messagePayload.message.offset}`,
    );

    let lastError = new Error('Unknown error');

    for (let i = 0; i < this.MAX_RETRIES; ++i) {
      try {
        await this.messageHandler.handleMessage(messagePayload);
        await this.commitOffset(messagePayload);
        this.logger.log(`Processed in ${i + 1} attempt`);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (lastError instanceof PermanentError) {
          this.logger.error('Permanent error detected, sending to DLQ');
          await this.sendToDlq(messagePayload, lastError);
          await this.commitOffset(messagePayload);

          return;
        }

        if (i < this.MAX_RETRIES - 1) {
          const backoff = this.BASE_DELAY * Math.pow(2, i);
          this.logger.debug(`Retrying in ${backoff}ms...`);
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
    }

    this.logger.error(
      `Max retries (${this.MAX_RETRIES}) reached, sending to DLQ`,
    );
    await this.sendToDlq(messagePayload, lastError);
    await this.commitOffset(messagePayload);
  }

  private async commitOffset({
    topic,
    partition,
    message,
  }: KafkaJS.EachMessagePayload): Promise<void> {
    await this.consumer?.commitOffsets([
      {
        topic,
        partition,
        offset: (Number(message.offset) + 1).toString(),
      },
    ]);
  }
}
