import { UserAccountActivatedEvent } from '../events/user-account-activated.event';
import { emailLayout } from './base.layout';

interface EmailOptions {
  companyName: string;
  frontendBaseUrl: string;
  event: UserAccountActivatedEvent;
}

export const userAccountActivatedEmail = (options: EmailOptions) => {
  const loginUrl = `${options.frontendBaseUrl}/login`;

  const content = `
<p>Hello ${options.event.firstName},</p>

<p>
Your account has been successfully activated. You can now sign in and start using it.
</p>

<p style="text-align:center;padding:30px 0;">
<a href="${loginUrl}"
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
Sign In
</a>
</p>

<p>If you did not activate this account, please contact support.</p>
`;

  return emailLayout({
    companyName: options.companyName,
    title: 'Account Activated',
    content,
    timestamp: options.event.timestamp,
  });
};
