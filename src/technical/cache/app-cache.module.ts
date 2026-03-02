import KeyvRedis from '@keyv/redis';
import { AppConfigModule } from '@technical/app-config/app-config.module';
import { AppConfig } from '@technical/app-config/app-config';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { AppCacheService } from './app-cache.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfig],
      useFactory: (config: AppConfig) => {
        return {
          stores: [
            new KeyvRedis(config.values.REDIS_URL, {
              connectionTimeout: 3000,
            }),
          ],
        };
      },
    }),
  ],
  providers: [AppCacheService],
  exports: [AppCacheService],
})
export class AppCacheModule {}
