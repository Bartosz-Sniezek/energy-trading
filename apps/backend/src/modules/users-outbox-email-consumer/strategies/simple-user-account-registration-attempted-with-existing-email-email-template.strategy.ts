import { UserAccountRegistrationAttemptedWithExistingAccountEvent } from '../events/user-account-registration-attempted-with-existing-accounter.event';
import { EmailTemplate } from '../interfaces/email-template.strategy';
import { UserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy } from '../interfaces/user-account-registration-attempted-with-existing-email-email-template.strategy';

export class SimpleUserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy implements UserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy {
  private readonly subject = 'Account Already Exists';

  getTemplate(
    event: UserAccountRegistrationAttemptedWithExistingAccountEvent,
  ): EmailTemplate {
    const greetings = ['Hello', event.firstName, event.lastName]
      .filter((value) => value)
      .join(' ');
    const html = `${greetings}! We noticed you tried to create an account with us, but it looks like an account with this email address already exists. If you forgot your password, you can reset it here: [Reset Password Link]`;

    return {
      to: [event.email],
      subject: this.subject,
      html,
      text: html,
    };
  }
}
