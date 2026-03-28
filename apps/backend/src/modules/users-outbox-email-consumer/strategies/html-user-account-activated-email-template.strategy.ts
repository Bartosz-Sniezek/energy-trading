import { Injectable } from '@nestjs/common';
import { UserAccountActivatedEvent } from '../../../domain/users/events/user-account-activated.event';
import { userAccountActivatedEmail } from '../html-templates/user-account-activated.layout';
import { EmailTemplate } from '../interfaces/email-template.strategy';
import { UserAccountActivatedEmailTemplateStrategy } from '../interfaces/user-account-activated-email-template.strategy';
import { AppConfig } from '@technical/app-config/app-config';

@Injectable()
export class HtmlUserAccountActivatedEmailTemplateStrategy implements UserAccountActivatedEmailTemplateStrategy {
  private readonly subject = 'Account activated';

  constructor(private readonly appConfig: AppConfig) {}

  getTemplate(event: UserAccountActivatedEvent): EmailTemplate {
    const html = userAccountActivatedEmail({
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
