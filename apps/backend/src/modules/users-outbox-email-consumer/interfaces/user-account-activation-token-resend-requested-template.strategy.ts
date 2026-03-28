import { UserAccountActivationTokenResendRequestedEvent } from '../../../domain/users/events/user-account-activation-token-resend-requested.event';
import { EmailTemplateStrategy } from './email-template.strategy';

export type UserAccountActivationTokenResendRequestedTemplateStrategy =
  EmailTemplateStrategy<UserAccountActivationTokenResendRequestedEvent>;
