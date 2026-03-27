import { Inject, Injectable } from '@nestjs/common';
import { DebeziumOutboxMessage } from '../../../common/kafka/debezium-connector-message.parser';
import { EmailTemplate } from '../interfaces/email-template.strategy';
import { EventMapper } from '../interfaces/event-mapper';
import { USER_ACCOUNT_REGISTERED_EMAIL_TEMPLATE } from '../constants';
import { UserAccountCreatedEvent } from '../events/user-account-created.event';
import type { UserAccountRegisteredEmailTemplateStrategy } from '../interfaces/user-account-registered-email-template.strategy';

@Injectable()
export class UserAccountCreatedEventMapper implements EventMapper<UserAccountCreatedEvent> {
  constructor(
    @Inject(USER_ACCOUNT_REGISTERED_EMAIL_TEMPLATE)
    private readonly template: UserAccountRegisteredEmailTemplateStrategy,
  ) {}

  parse(event: DebeziumOutboxMessage): UserAccountCreatedEvent {
    return UserAccountCreatedEvent.parse(event);
  }

  createTemplate(event: UserAccountCreatedEvent): EmailTemplate {
    return this.template.getTemplate(event);
  }
}
