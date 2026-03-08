import { Injectable } from '@nestjs/common';
import { MailService, SendMailOptions } from './interfaces/mail-service';
import { AppConfig } from '@technical/app-config/app-config';
import { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NodemailerMailService implements MailService {
  private transporter: Transporter;

  constructor(private readonly appConfig: AppConfig) {
    this.transporter = nodemailer.createTransport({
      host: appConfig.smtpConfig.host,
      port: appConfig.smtpConfig.port,
      secure: false,
    });
  }

  async send(options: SendMailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: this.appConfig.values.MAILER_FROM,
      to: options.to?.map((email) => email.getValue()),
      cc: options.cc?.map((email) => email.getValue()),
      bcc: options.bcc?.map((email) => email.getValue()),
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
  }
}
