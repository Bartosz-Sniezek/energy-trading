import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { PriceEngine } from './price-engine';
import { KAFKA_SERVICE } from '@modules/kafka/constants';
import { KafkaJS } from '@confluentinc/kafka-javascript';
import { AppConfig } from '@technical/app-config/app-config';
import { sleep } from '@utils/sleep';

@Injectable()
export class PriceTickProducer implements OnModuleInit, OnModuleDestroy {
  private readonly TICK_INTERVAL_MS: number;
  private readonly producer: KafkaJS.Producer;
  protected readonly TICK_TOPIC: string;
  private readonly logger: Logger;

  constructor(
    appConfig: AppConfig,
    @Inject(KAFKA_SERVICE)
    kafkaService: KafkaJS.Kafka,
    private readonly engine: PriceEngine,
    @Optional()
    logger?: Logger,
  ) {
    this.logger = logger ? logger : new Logger(PriceTickProducer.name);
    this.TICK_INTERVAL_MS = appConfig.tickConfig.tickInterval;
    this.TICK_TOPIC = appConfig.tickConfig.tickTopic;
    this.producer = kafkaService.producer({
      'allow.auto.create.topics': true,
      'client.id': 'simulation-tick',
      'compression.type': 'gzip',
      log_level: appConfig.values.KAFKA_LOG_LEVEL ?? 6,
    });
  }

  async onModuleInit() {
    await this.producer.connect();
    this.startFeed();
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  private async startFeed(): Promise<void> {
    while (true) {
      try {
        const tick = this.engine.tick(this.TICK_INTERVAL_MS);
        await this.producer.send({
          topic: this.TICK_TOPIC,
          messages: tick.map((commodity) => ({
            key: commodity.symbol,
            value: JSON.stringify(commodity),
            partition: 0,
          })),
        });
      } catch (error) {
        this.logger.error(error);
      } finally {
        await sleep(this.TICK_INTERVAL_MS);
      }
    }
  }
}
