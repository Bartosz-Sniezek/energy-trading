import { EmailTemplate } from './email-template.strategy';
import { BaseEventMapper } from '@domain/users/events/mappers/base-event-mapper';

export interface EmailTemplateEventMapper<T> extends BaseEventMapper<T> {
  createTemplate(event: T): EmailTemplate;
}
