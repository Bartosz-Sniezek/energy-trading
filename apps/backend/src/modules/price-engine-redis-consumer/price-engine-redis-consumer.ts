import { PermanentError } from '@common/kafka/permanent.error';
import { KafkaJS } from '@confluentinc/kafka-javascript';
import { EachMessagePayload } from '@confluentinc/kafka-javascript/types/kafkajs';
import { commitOffset } from '@modules/kafka/commit-offset';
import { KAFKA_SERVICE } from '@modules/kafka/constants';
import { PriceTick } from '@modules/price-engine/price-engine';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { AppConfig } from '@technical/app-config/app-config';
import { RedisPub } from '@technical/redis/redis-pub';
import { RedisClient } from '@technical/redis/redis.client';

@Injectable()
export class PriceEngineRedisConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly consumer: KafkaJS.Consumer;
  private readonly logger: Logger;

  constructor(
    @Inject(KAFKA_SERVICE)
    kafka: KafkaJS.Kafka,
    private readonly appConfig: AppConfig,
    private readonly pub: RedisPub,
    private readonly client: RedisClient,
    @Optional()
    logger?: Logger,
  ) {
    this.logger = logger ? logger : new Logger(PriceEngineRedisConsumer.name);
    this.consumer = kafka.consumer({
      'group.id': 'redis-price-consumer',
      'session.timeout.ms': 10000,
      'max.poll.interval.ms': 10000,
      'heartbeat.interval.ms': 7000,
      'auto.offset.reset': 'latest',
      'enable.auto.commit': false,
      log_level: appConfig.values.KAFKA_LOG_LEVEL ?? 6,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: this.appConfig.tickConfig.tickTopic,
    });
    await this.consumer.run({
      eachMessage: async (msg) => this.handleMessage(msg),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
  }

  async handleMessage(msg: EachMessagePayload): Promise<void> {
    try {
      const data = msg.message.value?.toString();

      if (data == null) {
        throw new PermanentError('Data is null');
      }

      const parsed: PriceTick = JSON.parse(data);

      await Promise.all([
        this.client.set(`price:${parsed.symbol}`, data),
        this.pub.publish(`feed:${parsed.symbol}`, data),
      ]);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `topic: ${msg.topic} | offset: ${msg.message.offset} | error: ${error.message}`,
        );
      } else {
        this.logger.error(
          `topic: ${msg.topic} | offset: ${msg.message.offset} | error: ${JSON.stringify(error)}`,
        );
      }
    } finally {
      await this.commitMsgOffset(msg);
    }
  }

  private async commitMsgOffset(msg: EachMessagePayload): Promise<void> {
    await commitOffset({
      consumer: this.consumer,
      message: msg.message,
      partition: msg.partition,
      topic: msg.topic,
    });
  }
}
