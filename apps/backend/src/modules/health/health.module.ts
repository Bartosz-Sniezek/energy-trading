import { Module } from '@nestjs/common';
import { AppCacheModule } from '@technical/cache/app-cache.module';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { KeyvRedisHealthIndicator } from './keyv-redis.health';
import { KafkaHealthIndicator } from './kafka.health';
import { KafkaModule } from '@modules/kafka/kafka.module';

@Module({
  imports: [
    AppCacheModule,
    KafkaModule.forRoot({ clientId: 'health-check' }),
    TerminusModule,
  ],
  providers: [KeyvRedisHealthIndicator, KafkaHealthIndicator],
  controllers: [HealthController],
})
export class HealthModule {}
