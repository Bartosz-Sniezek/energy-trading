import { DebeziumOutboxMessage } from '../debezium-connector-message.parser';
import { UserAccountActivatedEventMapper } from './user-account-activated.event-mapper';
import { v7 } from 'uuid';
import { UserEvents } from '@domain/users/events.enum';
import { randomEmail } from 'test/faker/random-email';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { mock } from 'vitest-mock-extended';
import { UserAccountActivatedEmailTemplateStrategy } from '../interfaces/user-account-activated-email-template.strategy';
import { UserAccountActivatedEvent } from '../events/user-account-activated.event';
import { EmailTemplate } from '../interfaces/email-template.strategy';
import { randomCorrelationId } from 'test/faker/random-correlation-id';

describe(UserAccountActivatedEventMapper.name, () => {
  const templateMock = mock<UserAccountActivatedEmailTemplateStrategy>();
  const mapper = new UserAccountActivatedEventMapper(templateMock);

  describe(mapper.parse.name, () => {
    it('should parse message', () => {
      const validMessage: DebeziumOutboxMessage = {
        id: v7(),
        correlationId: randomCorrelationId(),
        aggregateId: v7(),
        timestamp: new Date().toISOString(),
        eventType: UserEvents.USER_ACCOUNT_ACTIVATED,
        payload: {
          email: randomEmail().getValue(),
          firstName: randomFirstName(),
          lastName: randomLastName(),
        },
      };

      const event = mapper.parse(validMessage);

      expect(event).toBeInstanceOf(UserAccountActivatedEvent);
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
        mapper.createTemplate(mock<UserAccountActivatedEvent>()),
      ).toMatchObject(template);
      expect(templateMock.getTemplate).toHaveBeenCalledOnce();
    });
  });
});
