import { Injectable } from '@nestjs/common';
import { UserAccountActivationTokenResendRequestedEvent } from '../events/user-account-activation-token-resend-requested.event';
import { EmailTemplate } from '../interfaces/email-template.strategy';
import { UserAccountActivationTokenResendRequestedTemplateStrategy } from '../interfaces/user-account-activation-token-resend-requested-template.strategy';
import { AppConfig } from '@technical/app-config/app-config';

@Injectable()
export class HtmlUserAccountActivationTokenResendRequestedTemplateStrategy implements UserAccountActivationTokenResendRequestedTemplateStrategy {
  constructor(private readonly appConfig: AppConfig) {}

  getTemplate(
    event: UserAccountActivationTokenResendRequestedEvent,
  ): EmailTemplate {
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8" />
        <title>Activate your account</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f5f7fb;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background-color:#f5f7fb;">
            <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px;">
                
                <tr>
                    <td style="text-align:center;padding-bottom:20px;">
                    <h2 style="margin:0;color:#333;">Account Activation</h2>
                    </td>
                </tr>

                <tr>
                    <td style="color:#444;font-size:15px;line-height:1.6;">
                    <p>Hello ${event.firstName},</p>

                    <p>
                        You requested a new activation link for your account.  
                        Please confirm your email address by clicking the button below.
                    </p>
                    </td>
                </tr>

                <tr>
                    <td align="center" style="padding:30px 0;">
                    <a 
                        href="${this.appConfig.values.FRONTEND_BASE_URL}/activate?token=${event.activationToken}&userId=${event.userId}" 
                        style="
                        background-color:#4f46e5;
                        color:#ffffff;
                        text-decoration:none;
                        padding:14px 28px;
                        border-radius:6px;
                        font-weight:bold;
                        display:inline-block;
                        font-size:14px;
                        "
                    >
                        Activate Account
                    </a>
                    </td>
                </tr>

                <tr>
                    <td style="color:#666;font-size:13px;line-height:1.6;">
                    <p>
                        This activation link will expire on:<br/>
                        <strong>${event.activationTokenExpirationDate}</strong>
                    </p>

                    <p>
                        If you did not request this email, you can safely ignore it.
                    </p>
                    </td>
                </tr>

                <tr>
                    <td style="padding-top:30px;border-top:1px solid #eee;color:#999;font-size:12px;text-align:center;">
                    © ${new Date(event.timestamp).getFullYear()} Energy Trading
                    </td>
                </tr>

                </table>
            </td>
            </tr>
        </table>
        </body>
        </html>
    `;
    return {
      to: [event.email],
      subject: 'Activate your account',
      html,
      text: html,
    };
  }
}
