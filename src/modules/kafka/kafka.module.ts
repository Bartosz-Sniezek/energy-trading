import { AppConfigModule } from '@modules/app-config/app-config.module';
import { AppConfig } from '@modules/app-config/app-env-configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { KafkaJS } from '@confluentinc/kafka-javascript';
import { createTopics, CreateTopticOptions } from './create-topics';

export const KAFKA_SERVICE = Symbol('KAFKA_SERVICE');

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
      ],
      exports: [KAFKA_SERVICE],
    };
  }
}
