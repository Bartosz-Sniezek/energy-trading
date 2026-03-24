import { Injectable } from '@nestjs/common';
import { AppConfig } from '@technical/app-config/app-config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisClient extends Redis {
  private readonly __type = Symbol('redis_client');

  constructor(appConfig: AppConfig) {
    const url = new URL(appConfig.values.REDIS_URL);
    super({
      host: url.hostname,
      username: url.username,
      password: url.password,
      port: parseInt(url.port),
    });
  }
}
