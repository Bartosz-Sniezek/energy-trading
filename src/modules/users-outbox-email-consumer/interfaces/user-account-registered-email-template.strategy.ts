import { UserAccountCreatedEvent } from '../events/user-account-created.event';
import { EmailTemplateStrategy } from './email-template.strategy';

export interface UserAccountRegisteredEmailTemplateStrategy extends EmailTemplateStrategy<UserAccountCreatedEvent> {}
