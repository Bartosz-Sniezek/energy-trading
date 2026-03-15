import { Inject, Injectable } from '@nestjs/common';
import { DebeziumOutboxMessage } from '../debezium-connector-message.parser';
import { UserAccountActivatedEvent } from '../events/user-account-activated.event';
import { EmailTemplate } from '../interfaces/email-template.strategy';
import { EventMapper } from '../interfaces/event-mapper';
import { USER_ACCOUNT_ACTIVATED_EMAIL_TEMPLATE } from '../constants';
import type { UserAccountActivatedEmailTemplateStrategy } from '../interfaces/user-account-activated-email-template.strategy';

@Injectable()
export class UserAccountActivatedEventMapper implements EventMapper<UserAccountActivatedEvent> {
  constructor(
    @Inject(USER_ACCOUNT_ACTIVATED_EMAIL_TEMPLATE)
    private readonly template: UserAccountActivatedEmailTemplateStrategy,
  ) {}

  parse(event: DebeziumOutboxMessage): UserAccountActivatedEvent {
    return UserAccountActivatedEvent.parse(event);
  }

  createTemplate(event: UserAccountActivatedEvent): EmailTemplate {
    return this.template.getTemplate(event);
  }
}
