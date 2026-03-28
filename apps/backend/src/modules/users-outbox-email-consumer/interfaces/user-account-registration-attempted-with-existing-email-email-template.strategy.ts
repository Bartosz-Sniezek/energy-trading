import { UserAccountRegistrationAttemptedWithExistingAccountEvent } from '../../../domain/users/events/user-account-registration-attempted-with-existing-accounter.event';
import { EmailTemplateStrategy } from './email-template.strategy';

export type UserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy =
  EmailTemplateStrategy<UserAccountRegistrationAttemptedWithExistingAccountEvent>;
