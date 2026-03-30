import { UsersOutboxEmailConsumerModule } from '@modules/users-outbox-email-consumer/users-outbox-email-consumer.module';
import { UsersModule } from '@modules/users/users.module';
import { Logger, Module } from '@nestjs/common';
import { AppConfigModule } from '@technical/app-config/app-config.module';
import { DatabaseModule } from '@technical/database/database.module';
import { AuthModule } from '@modules/auth/auth.module';
import { HealthModule } from '@modules/health/health.module';
import { APP_FILTER } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import {
  PROBLEM_DETAILS_LOGGER,
  ProblemDetailsErrorFilter,
} from '@common/filters/problem-details-error.filter';
import { PriceEngineModule } from '@modules/price-engine/price-engine.module';
import { PriceEngineRedisConsumerModule } from '@modules/price-engine-redis-consumer/price-engine-redis-consumer.module';
import { PriceEngineGatewayModule } from '@modules/price-engine-gateway/price-engine-gateway.module';
import { Request } from 'express';
import { v7 } from 'uuid';
import { LedgerModule } from '@modules/ledger/ledger.module';
import { LedgerUsersOutboxConsumerModule } from '@modules/ledger-users-outbox-consumer/ledger-users-outbox-consumer.module';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: Request) =>
          req.headers['x-correlation-id']?.toString() ?? v7(),
      },
    }),
    AppConfigModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    UsersOutboxEmailConsumerModule,
    HealthModule,
    PriceEngineModule,
    PriceEngineRedisConsumerModule,
    PriceEngineGatewayModule,
    LedgerModule,
    LedgerUsersOutboxConsumerModule,
  ],
  controllers: [],
  providers: [
    {
      provide: PROBLEM_DETAILS_LOGGER,
      useClass: Logger,
    },
    {
      provide: APP_FILTER,
      useClass: ProblemDetailsErrorFilter,
    },
  ],
})
export class AppModule {}
