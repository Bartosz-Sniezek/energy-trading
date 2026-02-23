import { UsersOutboxEmailConsumerModule } from '@modules/users-outbox-email-consumer/users-outbox-email-consumer.module';
import { UsersModule } from '@modules/users/users.module';
import { Module } from '@nestjs/common';
import { AppConfigModule } from '@technical/app-config/app-config.module';
import { DatabaseModule } from '@technical/database/database.module';
import { HttpApiModule } from './http-api/http-api.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    UsersModule,
    UsersOutboxEmailConsumerModule,
    HttpApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
