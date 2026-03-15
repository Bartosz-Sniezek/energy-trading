import { UserAccountActivationTokenResendRequestedEvent } from '../events/user-account-activation-token-resend-requested.event';
import { EmailTemplateStrategy } from './email-template.strategy';

export type UserAccountActivationTokenResendRequestedTemplateStrategy =
  EmailTemplateStrategy<UserAccountActivationTokenResendRequestedEvent>;
