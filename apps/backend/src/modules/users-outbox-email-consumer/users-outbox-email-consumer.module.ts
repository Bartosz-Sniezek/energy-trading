import { KafkaModule } from '@modules/kafka/kafka.module';
import { Module, Provider } from '@nestjs/common';
import {
  CLIENT_ID,
  USER_ACCOUNT_ACTIVATED_EMAIL_TEMPLATE as USER_ACCOUNT_ACTIVATED_EMAIL_TEMPLATE_STRATEGY,
  USER_ACCOUNT_ACTIVATION_TOKEN_RESEND_REQUESTED_TEMPLATE_STRATEGY,
  USER_ACCOUNT_REGISTERED_EMAIL_TEMPLATE as USER_ACCOUNT_REGISTERED_EMAIL_TEMPLATE_STRATEGY,
  USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT_EMAIL_TEMPLATE_STRATEGY,
} from './constants';
import { UsersOutboxConsumer } from './users-outbox.consumer';
import { AppConfigModule } from '@technical/app-config/app-config.module';
import { DebeziumConnectorMessageParser } from './debezium-connector-message.parser';
import { MailingModule } from '@technical/mailing/mailing.module';
import { UsersOutboxMessageHandler } from './users-outbox-message.handler';
import { UserAccountActivatedEmailTemplateStrategy } from './interfaces/user-account-activated-email-template.strategy';
import { SimpleUserAccountActivatedEmailTemplateStrategy } from './strategies/simple-user-account-activated-email-template.strategy';
import { SimpleUserAccountRegisteredEmailTemplateStrategy } from './strategies/simple-user-account-registered-email-template.strategy';
import { UserAccountRegisteredEmailTemplateStrategy } from './interfaces/user-account-registered-email-template.strategy';
import { SimpleUserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy } from './strategies/simple-user-account-registration-attempted-with-existing-email-email-template.strategy';
import { UserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy } from './interfaces/user-account-registration-attempted-with-existing-email-email-template.strategy';
import { HtmlUserAccountActivationTokenResendRequestedTemplateStrategy } from './strategies/html-user-account-activation-token-resend-requested-template.strategy';
import { UserAccountActivationTokenResendRequestedTemplateStrategy } from './interfaces/user-account-activation-token-resend-requested-template.strategy';
import { EventMapperRegistry } from './event-mapper-registry';
import { UserAccountCreatedEventMapper } from './event-mappers/user-account-created.event-mapper';
import { UserAccountActivatedEventMapper } from './event-mappers/user-account-activated.event-mapper';
import { UserAccountActivationTokenResendRequestedEventMapper } from './event-mappers/user-account-activation-token-resend-requested.event-mapper';
import { UserAccountRegistrationAttemptedWithExistingAccountEventMapper } from './event-mappers/user-account-registration-attempted-with-existing-account.event-mapper';

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
    {
      provide: USER_ACCOUNT_ACTIVATION_TOKEN_RESEND_REQUESTED_TEMPLATE_STRATEGY,
      useClass: HtmlUserAccountActivationTokenResendRequestedTemplateStrategy,
    } satisfies Provider<UserAccountActivationTokenResendRequestedTemplateStrategy>,
    DebeziumConnectorMessageParser,
    UsersOutboxConsumer,
    UsersOutboxMessageHandler,
    // event mappers
    UserAccountCreatedEventMapper,
    UserAccountActivatedEventMapper,
    UserAccountActivationTokenResendRequestedEventMapper,
    UserAccountRegistrationAttemptedWithExistingAccountEventMapper,
    // registries
    EventMapperRegistry,
  ],
})
export class UsersOutboxEmailConsumerModule {}
