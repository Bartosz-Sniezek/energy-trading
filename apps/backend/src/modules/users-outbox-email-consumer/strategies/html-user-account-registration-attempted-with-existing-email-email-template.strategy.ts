import { Injectable } from '@nestjs/common';
import { UserAccountRegistrationAttemptedWithExistingAccountEvent } from '../../../domain/users/events/user-account-registration-attempted-with-existing-accounter.event';
import { EmailTemplate } from '../interfaces/email-template.strategy';
import { UserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy } from '../interfaces/user-account-registration-attempted-with-existing-email-email-template.strategy';
import { AppConfig } from '@technical/app-config/app-config';
import { existingAccountRegistrationEmail } from '../html-templates/existing-account-registration-attempt.layout';

@Injectable()
export class HtmlUserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy implements UserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy {
  private readonly subject = 'Account Already Exists';

  constructor(private readonly appConfig: AppConfig) {}

  getTemplate(
    event: UserAccountRegistrationAttemptedWithExistingAccountEvent,
  ): EmailTemplate {
    const html = existingAccountRegistrationEmail({
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
