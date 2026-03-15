import { Email } from '@domain/users/value-objects/email';

export type EmailTemplate = {
  to: Email[];
  subject: string;
  html: string;
  text: string;
};

export interface EmailTemplateStrategy<TEvent> {
  getTemplate(event: TEvent): EmailTemplate;
}
