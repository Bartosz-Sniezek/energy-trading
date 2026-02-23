import { DynamicModule, Module } from '@nestjs/common';
import { KafkaJS } from '@confluentinc/kafka-javascript';
import { createTopics, CreateTopticOptions } from './create-topics';
import { AppConfig } from '@technical/app-config/app-config';
import { AppConfigModule } from '@technical/app-config/app-config.module';
import { ConsumerFactory } from './consumer.factory';
import { KAFKA_SERVICE } from './constants';

export interface KafkaModuleOptions {
  clientId: string;
  createTopicsOptions?: Omit<CreateTopticOptions, 'kafka'>;
}

@Module({})
export class KafkaModule {
  static forRoot(options: KafkaModuleOptions): DynamicModule {
    return {
      module: KafkaModule,
      imports: [AppConfigModule],
      providers: [
        {
          inject: [AppConfig],
          provide: KAFKA_SERVICE,
          useFactory: async (config: AppConfig) => {
            const kafka = new KafkaJS.Kafka({
              'bootstrap.servers': config.values.KAFKA_BROKER,
              'client.id': options.clientId,
            });

            if (options.createTopicsOptions)
              await createTopics({ ...options.createTopicsOptions, kafka });

            return kafka;
          },
        },
        ConsumerFactory,
      ],
      exports: [KAFKA_SERVICE, ConsumerFactory],
    };
  }
}
