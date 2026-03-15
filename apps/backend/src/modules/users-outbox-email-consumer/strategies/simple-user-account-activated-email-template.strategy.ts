import { UserAccountActivatedEvent } from '../events/user-account-activated.event';
import { EmailTemplate } from '../interfaces/email-template.strategy';
import { UserAccountActivatedEmailTemplateStrategy } from '../interfaces/user-account-activated-email-template.strategy';

export class SimpleUserAccountActivatedEmailTemplateStrategy implements UserAccountActivatedEmailTemplateStrategy {
  private readonly subject = 'Account activated';

  getTemplate(event: UserAccountActivatedEvent): EmailTemplate {
    const greetings = ['Hello', event.firstName, event.lastName]
      .filter((value) => value)
      .join(' ');
    const html = `${greetings}! Your account has been activated. You can now log in.`;

    return {
      to: [event.email],
      subject: this.subject,
      html,
      text: html,
    };
  }
}
