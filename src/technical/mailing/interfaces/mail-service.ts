import { Email } from '@domain/users/value-objects/email';

export interface SendMailOptions {
  to: Email[];
  subject: string;
  template?: string;
  html?: string;
  context?: Record<string, any>;
  from?: Email;
  cc?: Email[];
  bcc?: Email[];
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
  }>;
}

export interface MailService {
  send(options: SendMailOptions): Promise<void>;
}
