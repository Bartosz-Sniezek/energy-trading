import { Inject, Injectable } from '@nestjs/common';
import { UserOutboxMessageHandler } from '../interfaces/user-outbox-message-handler';
import { DebeziumOutboxMessage } from '../debezium-connector-message.parser';
import { MAIL_SERVICE } from '@technical/mailing/constants';
import type { MailService } from '@technical/mailing/interfaces/mail-service';
import { USER_ACCOUNT_ACTIVATION_TOKEN_RESEND_REQUESTED_TEMPLATE_STRATEGY } from '../constants';
import { HtmlUserAccountActivationTokenResendRequestedTemplateStrategy } from '../strategies/html-user-account-activation-token-resend-requested-template.strategy';
import { UserAccountActivationTokenResendRequestedEvent } from '../events/user-account-activation-token-resend-requested.event';

@Injectable()
export class UserAccountActivationTokenResendRequestedHandler implements UserOutboxMessageHandler {
  constructor(
    @Inject(MAIL_SERVICE)
    private readonly mailService: MailService,
    @Inject(USER_ACCOUNT_ACTIVATION_TOKEN_RESEND_REQUESTED_TEMPLATE_STRATEGY)
    private readonly emailTemplateStrategy: HtmlUserAccountActivationTokenResendRequestedTemplateStrategy,
  ) {}

  async handle(data: DebeziumOutboxMessage): Promise<void> {
    const event = UserAccountActivationTokenResendRequestedEvent.parse(data);
    const template = this.emailTemplateStrategy.getTemplate(event);
    await this.mailService.send({
      to: [event.email],
      subject: template.subject,
      html: template.html,
    });
  }
}
