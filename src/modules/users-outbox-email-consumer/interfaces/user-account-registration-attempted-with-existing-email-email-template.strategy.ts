import { UserAccountRegistrationAttemptedWithExistingAccountEvent } from '../events/user-account-registration-attempted-with-existing-accounter.event';
import { EmailTemplateStrategy } from './email-template.strategy';

export interface UserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy extends EmailTemplateStrategy<UserAccountRegistrationAttemptedWithExistingAccountEvent> {}
