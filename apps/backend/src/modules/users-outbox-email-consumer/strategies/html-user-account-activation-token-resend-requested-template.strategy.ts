import { Injectable } from '@nestjs/common';
import { UserAccountActivationTokenResendRequestedEvent } from '../../../domain/users/events/user-account-activation-token-resend-requested.event';
import { EmailTemplate } from '../interfaces/email-template.strategy';
import { UserAccountActivationTokenResendRequestedTemplateStrategy } from '../interfaces/user-account-activation-token-resend-requested-template.strategy';
import { AppConfig } from '@technical/app-config/app-config';
import { userAccountActivationTokenResentEmail } from '../html-templates/user-account-activation-token-resend-requested.layout';

@Injectable()
export class HtmlUserAccountActivationTokenResendRequestedTemplateStrategy implements UserAccountActivationTokenResendRequestedTemplateStrategy {
  constructor(private readonly appConfig: AppConfig) {}

  getTemplate(
    event: UserAccountActivationTokenResendRequestedEvent,
  ): EmailTemplate {
    const html = userAccountActivationTokenResentEmail({
      companyName: this.appConfig.values.COMPANY_NAME,
      frontendBaseUrl: this.appConfig.values.FRONTEND_BASE_URL,
      event,
    });

    return {
      to: [event.email],
      subject: 'Activate your account',
      html,
      text: html,
    };
  }
}
