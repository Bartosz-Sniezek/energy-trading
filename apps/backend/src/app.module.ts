import { UsersOutboxEmailConsumerModule } from '@modules/users-outbox-email-consumer/users-outbox-email-consumer.module';
import { UsersModule } from '@modules/users/users.module';
import { Logger, Module } from '@nestjs/common';
import { AppConfigModule } from '@technical/app-config/app-config.module';
import { DatabaseModule } from '@technical/database/database.module';
import { HttpApiModule } from './http-api/http-api.module';
import { AuthModule } from '@modules/auth/auth.module';
import { HealthModule } from '@modules/health/health.module';
import { APP_FILTER } from '@nestjs/core';
import {
  PROBLEM_DETAILS_LOGGER,
  ProblemDetailsErrorFilter,
} from '@common/filters/problem-details-error.filter';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    UsersOutboxEmailConsumerModule,
    HttpApiModule,
    HealthModule,
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
