import { UserAccountActivationTokenResendRequestedEvent } from '../../../domain/users/events/user-account-activation-token-resend-requested.event';
import { emailLayout } from './base.layout';

interface EmailOptions {
  companyName: string;
  frontendBaseUrl: string;
  event: UserAccountActivationTokenResendRequestedEvent;
}

export const userAccountActivationTokenResentEmail = (
  options: EmailOptions,
) => {
  const activationUrl = `${options.frontendBaseUrl}/activate?token=${options.event.activationToken}`;

  const content = `
<p>Hello ${options.event.firstName},</p>

<p>
You requested a new activation link for your account. Please confirm your email
address by clicking the button below.
</p>

<p style="text-align:center;padding:30px 0;">
<a href="${activationUrl}"
style="
background-color:#4f46e5;
color:#ffffff;
text-decoration:none;
padding:14px 28px;
border-radius:6px;
font-weight:bold;
display:inline-block;
font-size:14px;
">
Activate Account
</a>
</p>

<p>
This activation link will expire on:<br>
<strong>${options.event.activationTokenExpirationDate}</strong>
</p>

<p>If you did not request this email, you can safely ignore it.</p>

<p style="word-break:break-all;font-size:12px;color:#777;">
${activationUrl}
</p>
`;

  return emailLayout({
    companyName: options.companyName,
    title: 'Activate your account',
    content,
    timestamp: options.event.timestamp,
  });
};
