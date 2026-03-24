import { KafkaModule } from '@modules/kafka/kafka.module';
import { Module } from '@nestjs/common';
import { AppConfigModule } from '@technical/app-config/app-config.module';
import { RedisModule } from '@technical/redis/redis.module';
import { PriceEngineRedisConsumer } from './price-engine-redis-consumer';

@Module({
  imports: [
    RedisModule,
    AppConfigModule,
    KafkaModule.forRoot({
      clientId: 'price-engine-redis-consumer',
    }),
  ],
  providers: [PriceEngineRedisConsumer],
})
export class PriceEngineRedisConsumerModule {}
