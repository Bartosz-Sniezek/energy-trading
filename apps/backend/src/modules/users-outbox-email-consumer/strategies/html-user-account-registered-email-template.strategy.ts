import { Injectable } from '@nestjs/common';
import { UserAccountCreatedEvent } from '../../../domain/users/events/user-account-created.event';
import { userAccountCreatedEmail } from '../html-templates/user-account-created.layout';
import { EmailTemplate } from '../interfaces/email-template.strategy';
import { UserAccountRegisteredEmailTemplateStrategy } from '../interfaces/user-account-registered-email-template.strategy';
import { AppConfig } from '@technical/app-config/app-config';

@Injectable()
export class HtmlUserAccountRegisteredEmailTemplateStrategy implements UserAccountRegisteredEmailTemplateStrategy {
  private readonly subject = 'Account Registration';

  constructor(private readonly appConfig: AppConfig) {}

  getTemplate(event: UserAccountCreatedEvent): EmailTemplate {
    const html = userAccountCreatedEmail({
      companyName: this.appConfig.values.COMPANY_NAME,
      frontendBaseUrl: this.appConfig.values.FRONTEND_BASE_URL,
      event,
    });

    return {
      to: [event.email],
      subject: this.subject,
      html,
      text: html,
    };
  }
}
