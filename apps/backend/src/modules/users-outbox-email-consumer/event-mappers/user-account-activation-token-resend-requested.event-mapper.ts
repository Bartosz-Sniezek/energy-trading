import { Inject, Injectable } from '@nestjs/common';
import { DebeziumOutboxMessage } from '../../../common/kafka/debezium-connector-message.parser';
import { EmailTemplate } from '../interfaces/email-template.strategy';
import { EmailTemplateEventMapper } from '../interfaces/event-mapper';
import { USER_ACCOUNT_ACTIVATION_TOKEN_RESEND_REQUESTED_TEMPLATE_STRATEGY } from '../constants';
import { type UserAccountActivationTokenResendRequestedTemplateStrategy } from '../interfaces/user-account-activation-token-resend-requested-template.strategy';
import { UserAccountActivationTokenResendRequestedEvent } from '../../../domain/users/events/user-account-activation-token-resend-requested.event';

@Injectable()
export class UserAccountActivationTokenResendRequestedEventMapper implements EmailTemplateEventMapper<UserAccountActivationTokenResendRequestedEvent> {
  constructor(
    @Inject(USER_ACCOUNT_ACTIVATION_TOKEN_RESEND_REQUESTED_TEMPLATE_STRATEGY)
    private readonly template: UserAccountActivationTokenResendRequestedTemplateStrategy,
  ) {}

  parse(
    event: DebeziumOutboxMessage,
  ): UserAccountActivationTokenResendRequestedEvent {
    return UserAccountActivationTokenResendRequestedEvent.parse(event);
  }

  createTemplate(
    event: UserAccountActivationTokenResendRequestedEvent,
  ): EmailTemplate {
    return this.template.getTemplate(event);
  }
}
