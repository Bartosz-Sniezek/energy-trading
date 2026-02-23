import { UserAccountActivatedEvent } from '../events/user-account-activated.event';
import { EmailTemplateStrategy } from './email-template.strategy';

export type UserAccountActivatedEmailTemplateStrategy =
  EmailTemplateStrategy<UserAccountActivatedEvent>;
