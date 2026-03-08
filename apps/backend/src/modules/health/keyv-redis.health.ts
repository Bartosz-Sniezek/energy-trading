import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { AppCacheService } from '@technical/cache/app-cache.service';

@Injectable()
export class KeyvRedisHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly cacheService: AppCacheService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const testKey = `health-check-${Date.now()}`;
    const testValue = 'ping';

    try {
      await this.cacheService.set(testKey, testValue, 5000);

      const value = await this.cacheService.get<string>(testKey);

      await this.cacheService.delete(testKey);

      const isHealthy = value === testValue;

      if (!isHealthy) {
        return indicator.down({
          message: 'Redis cache read/write validation failed',
          expectedValue: testValue,
          receivedValue: null,
        });
      }

      return indicator.up();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      return indicator.down({
        message: 'Redis cache connection failed',
        error: errorMessage,
      });
    }
  }
}
