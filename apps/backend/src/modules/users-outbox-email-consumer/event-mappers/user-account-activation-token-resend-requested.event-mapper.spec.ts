import { DebeziumOutboxMessage } from '../debezium-connector-message.parser';
import { v7 } from 'uuid';
import { UserEvents } from '@domain/users/events.enum';
import { randomEmail } from 'test/faker/random-email';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { mock } from 'vitest-mock-extended';
import { EmailTemplate } from '../interfaces/email-template.strategy';
import { UserAccountActivationTokenResendRequestedEventMapper } from './user-account-activation-token-resend-requested.event-mapper';
import { UserAccountActivationTokenResendRequestedTemplateStrategy } from '../interfaces/user-account-activation-token-resend-requested-template.strategy';
import { UserAccountActivationTokenResendRequestedEvent } from '../events/user-account-activation-token-resend-requested.event';
import { randomUUID } from 'crypto';

describe(UserAccountActivationTokenResendRequestedEventMapper.name, () => {
  const templateMock =
    mock<UserAccountActivationTokenResendRequestedTemplateStrategy>();
  const mapper = new UserAccountActivationTokenResendRequestedEventMapper(
    templateMock,
  );

  describe(mapper.parse.name, () => {
    it('should parse message', () => {
      const validMessage: DebeziumOutboxMessage = {
        id: v7(),
        aggregateId: v7(),
        timestamp: new Date().toISOString(),
        eventType: UserEvents.ACTIVATION_TOKEN_RESEND_REQUESTED,
        payload: {
          email: randomEmail().getValue(),
          firstName: randomFirstName(),
          lastName: randomLastName(),
          activationToken: randomUUID(),
          activationTokenExpirationDate: new Date().toISOString(),
        },
      };

      const event = mapper.parse(validMessage);

      expect(event).toBeInstanceOf(
        UserAccountActivationTokenResendRequestedEvent,
      );
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
        mapper.createTemplate(
          mock<UserAccountActivationTokenResendRequestedEvent>(),
        ),
      ).toMatchObject(template);
      expect(templateMock.getTemplate).toHaveBeenCalledOnce();
    });
  });
});
