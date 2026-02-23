export type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

export interface EmailTemplateStrategy<TEvent> {
  getTemplate(event: TEvent): EmailTemplate;
}
