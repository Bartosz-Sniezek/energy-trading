import { UserAccountRegistrationAttemptedWithExistingAccountEvent } from '../events/user-account-registration-attempted-with-existing-accounter.event';
import { emailLayout } from './base.layout';

interface EmailOptions {
  companyName: string;
  frontendBaseUrl: string;
  event: UserAccountRegistrationAttemptedWithExistingAccountEvent;
}

export const existingAccountRegistrationEmail = (options: EmailOptions) => {
  const loginUrl = `${options.frontendBaseUrl}/login`;

  const content = `
<p>Hello ${options.event.firstName},</p>

<p>
A registration attempt was made using this email address, but an account already exists.
</p>

<p>If you were trying to sign in, use the login page below.</p>

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

<p>If you forgot your password, you can reset it from the login page.</p>

<p>If you did not attempt to register, no action is required.</p>
`;

  return emailLayout({
    companyName: options.companyName,
    title: 'Account Already Exists',
    content,
    timestamp: options.event.timestamp,
  });
};
