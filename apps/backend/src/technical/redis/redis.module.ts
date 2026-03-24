import { Module } from '@nestjs/common';
import { AppConfigModule } from '@technical/app-config/app-config.module';
import { RedisClient } from './redis.client';
import { RedisPub } from './redis-pub';
import { RedisSub } from './redis.sub';

@Module({
  imports: [AppConfigModule],
  providers: [RedisClient, RedisPub, RedisSub],
  exports: [RedisClient, RedisPub, RedisSub],
})
export class RedisModule {}
