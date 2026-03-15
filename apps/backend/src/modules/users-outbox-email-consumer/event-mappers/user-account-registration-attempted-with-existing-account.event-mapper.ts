import { Inject, Injectable } from '@nestjs/common';
import { DebeziumOutboxMessage } from '../debezium-connector-message.parser';
import { EmailTemplate } from '../interfaces/email-template.strategy';
import { EventMapper } from '../interfaces/event-mapper';
import { USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT_EMAIL_TEMPLATE_STRATEGY } from '../constants';
import { UserAccountRegistrationAttemptedWithExistingAccountEvent } from '../events/user-account-registration-attempted-with-existing-accounter.event';
import type { UserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy } from '../interfaces/user-account-registration-attempted-with-existing-email-email-template.strategy';

@Injectable()
export class UserAccountRegistrationAttemptedWithExistingAccountEventMapper implements EventMapper<UserAccountRegistrationAttemptedWithExistingAccountEvent> {
  constructor(
    @Inject(
      USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT_EMAIL_TEMPLATE_STRATEGY,
    )
    private readonly template: UserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy,
  ) {}

  parse(
    event: DebeziumOutboxMessage,
  ): UserAccountRegistrationAttemptedWithExistingAccountEvent {
    return UserAccountRegistrationAttemptedWithExistingAccountEvent.parse(
      event,
    );
  }

  createTemplate(
    event: UserAccountRegistrationAttemptedWithExistingAccountEvent,
  ): EmailTemplate {
    return this.template.getTemplate(event);
  }
}
