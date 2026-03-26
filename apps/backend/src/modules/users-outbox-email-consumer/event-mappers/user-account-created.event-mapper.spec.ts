import { DebeziumOutboxMessage } from '../debezium-connector-message.parser';
import { v7 } from 'uuid';
import { UserEvents } from '@domain/users/events.enum';
import { randomEmail } from 'test/faker/random-email';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { mock } from 'vitest-mock-extended';
import { EmailTemplate } from '../interfaces/email-template.strategy';
import { UserAccountCreatedEventMapper } from './user-account-created.event-mapper';
import { HtmlUserAccountRegisteredEmailTemplateStrategy } from '../strategies/html-user-account-registered-email-template.strategy';
import { UserAccountCreatedEvent } from '../events/user-account-created.event';
import { randomUUID } from 'crypto';
import { randomCorrelationId } from 'test/faker/random-correlation-id';

describe(UserAccountCreatedEventMapper.name, () => {
  const templateMock = mock<HtmlUserAccountRegisteredEmailTemplateStrategy>();
  const mapper = new UserAccountCreatedEventMapper(templateMock);

  describe(mapper.parse.name, () => {
    it('should parse message', () => {
      const validMessage: DebeziumOutboxMessage = {
        id: v7(),
        correlationId: randomCorrelationId(),
        aggregateId: v7(),
        timestamp: new Date().toISOString(),
        eventType: UserEvents.USER_ACCOUNT_REGISTERED,
        payload: {
          email: randomEmail().getValue(),
          firstName: randomFirstName(),
          lastName: randomLastName(),
          activationToken: randomUUID(),
          activationTokenExpirationDate: new Date().toISOString(),
        },
      };

      const event = mapper.parse(validMessage);

      expect(event).toBeInstanceOf(UserAccountCreatedEvent);
    });
  });

  describe(mapper.createTemplate.name, () => {
    it('should return template', () => {
      const template: EmailTemplate = {
        to: [randomEmail()],
        html: 'html',
        subject: 'subject',
        text: 'text',
      };

      templateMock.getTemplate.mockReturnValueOnce(template);

      expect(
        mapper.createTemplate(mock<UserAccountCreatedEvent>()),
      ).toMatchObject(template);
      expect(templateMock.getTemplate).toHaveBeenCalledOnce();
    });
  });
});
