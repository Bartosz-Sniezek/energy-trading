import { UserAccountCreatedEvent } from '../events/user-account-created.event';
import { EmailTemplate } from '../interfaces/email-template.strategy';
import { UserAccountRegisteredEmailTemplateStrategy } from '../interfaces/user-account-registered-email-template.strategy';

export class SimpleUserAccountRegisteredEmailTemplateStrategy implements UserAccountRegisteredEmailTemplateStrategy {
  private readonly subject = 'Account Registration';

  getTemplate(event: UserAccountCreatedEvent): EmailTemplate {
    const greetings = ['Hello', event.firstName, event.lastName]
      .filter((value) => value)
      .join(' ');
    const html = `${greetings}! This email is sent to you as part of the process to create your new account. Verification token (valid until: ${event.activationTokenExpirationDate.toISOString()}): ${event.activationToken}`;

    return {
      subject: this.subject,
      html,
      text: html,
    };
  }
}
