import { Inject, Injectable } from '@nestjs/common';
import { EmailTemplate } from '../interfaces/email-template.strategy';
import { EmailTemplateEventMapper } from '../interfaces/event-mapper';
import { USER_ACCOUNT_REGISTERED_EMAIL_TEMPLATE } from '../constants';
import { UserAccountCreatedEvent } from '../../../domain/users/events/user-account-created.event';
import type { UserAccountRegisteredEmailTemplateStrategy } from '../interfaces/user-account-registered-email-template.strategy';
import { BaseUserAccountCreatedEventMapper } from '@domain/users/events/mappers/base-user-account-created.event-mapper';

@Injectable()
export class UserAccountCreatedEventMapper
  extends BaseUserAccountCreatedEventMapper
  implements EmailTemplateEventMapper<UserAccountCreatedEvent>
{
  constructor(
    @Inject(USER_ACCOUNT_REGISTERED_EMAIL_TEMPLATE)
    private readonly template: UserAccountRegisteredEmailTemplateStrategy,
  ) {
    super();
  }

  createTemplate(event: UserAccountCreatedEvent): EmailTemplate {
    return this.template.getTemplate(event);
  }
}
