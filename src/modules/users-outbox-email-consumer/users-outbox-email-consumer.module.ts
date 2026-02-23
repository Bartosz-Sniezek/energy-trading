import { KafkaModule } from '@modules/kafka/kafka.module';
import { Module } from '@nestjs/common';
import { CLIENT_ID } from './constants';
import { UsersOutboxConsumer } from './users-outbox.consumer';
import { AppConfigModule } from '@technical/app-config/app-config.module';
import { DebeziumConnectorMessageParser } from './debezium-connector-message.parser';
import { MailingModule } from '@technical/mailing/mailing.module';
import { EventHandlerRegistry } from './event-handler-registry';
import { UserAccountCreatedHandler } from './handlers/user-account-created.handler';

@Module({
  imports: [
    AppConfigModule,
    KafkaModule.forRoot({
      clientId: CLIENT_ID,
    }),
    MailingModule,
  ],
  providers: [
    DebeziumConnectorMessageParser,
    UsersOutboxConsumer,
    UserAccountCreatedHandler,
    EventHandlerRegistry,
  ],
})
export class UsersOutboxEmailConsumerModule {}
