import { Injectable } from '@nestjs/common';
import { AppConfig } from '@technical/app-config/app-config';
import { RedisPub } from '@technical/redis/redis-pub';
import { RedisClient } from '@technical/redis/redis.client';

@Injectable()
export class SessionAuthBridge {
  private readonly sessionTtlSec: number;

  constructor(
    appConfig: AppConfig,
    private readonly redisClient: RedisClient,
    private readonly redisPub: RedisPub,
  ) {
    this.sessionTtlSec = appConfig.values.JWT_ACCESS_TOKEN_EXPIRATION_SEC;
  }

  public async setSessionInCache(sessionId: string): Promise<void> {
    await this.redisClient.set(
      `auth:session:${sessionId}`,
      1,
      'EX',
      this.sessionTtlSec,
    );
  }

  public async sessionExists(sessionId: string): Promise<boolean> {
    return this.redisClient
      .get(`auth:session:${sessionId}`)
      .then((val) => val != null);
  }

  public async removeSessionFromCache(sessionId: string): Promise<void> {
    await Promise.all([
      this.redisClient.del(`auth:session:${sessionId}`),
      this.redisPub.publish('auth:session:remove', sessionId),
    ]);
  }
}
