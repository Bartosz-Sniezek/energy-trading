import { DebeziumOutboxMessage } from '../../../common/kafka/debezium-connector-message.parser';
import { v7 } from 'uuid';
import { UserEvents } from '@domain/users/events.enum';
import { randomEmail } from 'test/faker/random-email';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { mock } from 'vitest-mock-extended';
import { EmailTemplate } from '../interfaces/email-template.strategy';
import { UserAccountRegistrationAttemptedWithExistingAccountEventMapper } from './user-account-registration-attempted-with-existing-account.event-mapper';
import { UserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy } from '../interfaces/user-account-registration-attempted-with-existing-email-email-template.strategy';
import { UserAccountRegistrationAttemptedWithExistingAccountEvent } from '../../../domain/users/events/user-account-registration-attempted-with-existing-accounter.event';
import { randomCorrelationId } from 'test/faker/random-correlation-id';
import { randomUserId } from 'test/faker/random-user-id';

describe(
  UserAccountRegistrationAttemptedWithExistingAccountEventMapper.name,
  () => {
    const templateMock =
      mock<UserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy>();
    const mapper =
      new UserAccountRegistrationAttemptedWithExistingAccountEventMapper(
        templateMock,
      );

    describe(mapper.parse.name, () => {
      it('should parse message', () => {
        const validMessage: DebeziumOutboxMessage = {
          id: v7(),
          userId: randomUserId(),
          correlationId: randomCorrelationId(),
          aggregateId: v7(),
          timestamp: new Date().toISOString(),
          eventType:
            UserEvents.USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT,
          payload: {
            email: randomEmail().getValue(),
            firstName: randomFirstName(),
            lastName: randomLastName(),
          },
        };

        const event = mapper.parse(validMessage);

        expect(event).toBeInstanceOf(
          UserAccountRegistrationAttemptedWithExistingAccountEvent,
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
            mock<UserAccountRegistrationAttemptedWithExistingAccountEvent>(),
          ),
        ).toMatchObject(template);
        expect(templateMock.getTemplate).toHaveBeenCalledOnce();
      });
    });
  },
);
