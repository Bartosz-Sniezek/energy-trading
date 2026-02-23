import { KafkaModule } from '@modules/kafka/kafka.module';
import { Module, Provider } from '@nestjs/common';
import {
  CLIENT_ID,
  USER_ACCOUNT_ACTIVATED_EMAIL_TEMPLATE as USER_ACCOUNT_ACTIVATED_EMAIL_TEMPLATE_STRATEGY,
  USER_ACCOUNT_REGISTERED_EMAIL_TEMPLATE as USER_ACCOUNT_REGISTERED_EMAIL_TEMPLATE_STRATEGY,
  USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT_EMAIL_TEMPLATE_STRATEGY,
} from './constants';
import { UsersOutboxConsumer } from './users-outbox.consumer';
import { AppConfigModule } from '@technical/app-config/app-config.module';
import { DebeziumConnectorMessageParser } from './debezium-connector-message.parser';
import { MailingModule } from '@technical/mailing/mailing.module';
import { EventHandlerRegistry } from './event-handler-registry';
import { UserAccountCreatedHandler } from './handlers/user-account-created.handler';
import { UsersOutboxMessageHandler } from './users-outbox-message.handler';
import { UserAccountActivatedEmailTemplateStrategy } from './interfaces/user-account-activated-email-template.strategy';
import { SimpleUserAccountActivatedEmailTemplateStrategy } from './strategies/simple-user-account-activated-email-template.strategy';
import { SimpleUserAccountRegisteredEmailTemplateStrategy } from './strategies/simple-user-account-registered-email-template.strategy';
import { UserAccountRegisteredEmailTemplateStrategy } from './interfaces/user-account-registered-email-template.strategy';
import { SimpleUserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy } from './strategies/simple-user-account-registration-attempted-with-existing-email-email-template.strategy';
import { UserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy } from './interfaces/user-account-registration-attempted-with-existing-email-email-template.strategy';
import { UserAccountRegistrationAttemptedWithExistingEmaildHandler } from './handlers/user-account-registration-attempted-with-existing-email.handler';

@Module({
  imports: [
    AppConfigModule,
    KafkaModule.forRoot({
      clientId: CLIENT_ID,
    }),
    MailingModule,
  ],
  providers: [
    {
      provide: USER_ACCOUNT_ACTIVATED_EMAIL_TEMPLATE_STRATEGY,
      useClass: SimpleUserAccountActivatedEmailTemplateStrategy,
    } satisfies Provider<UserAccountActivatedEmailTemplateStrategy>,
    {
      provide: USER_ACCOUNT_REGISTERED_EMAIL_TEMPLATE_STRATEGY,
      useClass: SimpleUserAccountRegisteredEmailTemplateStrategy,
    } satisfies Provider<UserAccountRegisteredEmailTemplateStrategy>,
    {
      provide:
        USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT_EMAIL_TEMPLATE_STRATEGY,
      useClass:
        SimpleUserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy,
    } satisfies Provider<UserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy>,
    DebeziumConnectorMessageParser,
    UsersOutboxConsumer,
    UserAccountCreatedHandler,
    UsersOutboxMessageHandler,
    UserAccountRegistrationAttemptedWithExistingEmaildHandler,
    EventHandlerRegistry,
  ],
})
export class UsersOutboxEmailConsumerModule {}
