import { mock, mockReset } from 'vitest-mock-extended';
import { MailService } from '@technical/mailing/interfaces/mail-service';
import { DebeziumOutboxMessage } from '../debezium-connector-message.parser';
import { v7 } from 'uuid';
import { UserEvents } from '@domain/users/events.enum';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { randomEmail } from 'test/faker/random-email';
import { Logger } from '@nestjs/common';
import { InvalidEventTypeError } from '@common/errors/invalid-event-type.error';
import { EmailTemplate } from '../interfaces/email-template.strategy';
import { UserAccountRegistrationAttemptedWithExistingEmaildHandler } from './user-account-registration-attempted-with-existing-email.handler';
import { UserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy } from '../interfaces/user-account-registration-attempted-with-existing-email-email-template.strategy';

describe(UserAccountRegistrationAttemptedWithExistingEmaildHandler.name, () => {
  const mailService = mock<MailService>();
  const emailTemplateStrategyMock =
    mock<UserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy>();
  const mailTemplate: EmailTemplate = {
    subject: 'mail-subject',
    text: 'mail-text',
    html: 'mail-html',
  };
  emailTemplateStrategyMock.getTemplate.mockReturnValue(mailTemplate);
  const loggerMock = mock<Logger>();
  const handler = new UserAccountRegistrationAttemptedWithExistingEmaildHandler(
    mailService,
    emailTemplateStrategyMock,
    loggerMock,
  );

  beforeEach(() => {
    mockReset(mailService);
    mockReset(loggerMock);
  });

  it(`should successfully execute with valid event data`, async () => {
    const email = randomEmail();
    const event: DebeziumOutboxMessage = {
      id: v7(),
      aggregateId: v7(),
      eventType:
        UserEvents.USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT,
      timestamp: Date.now().toString(),
      payload: {
        email: email.getValue(),
        firstName: randomFirstName(),
        lastName: randomLastName(),
      },
    };

    await handler.handle(event);

    expect(mailService.send).toHaveBeenCalledWith({
      to: [email],
      subject: mailTemplate.subject,
      html: mailTemplate.html,
    });
  });

  it(`should throw with invalid event data`, async () => {
    const event: DebeziumOutboxMessage = {} as any;

    await expect(handler.handle(event)).rejects.toThrow(InvalidEventTypeError);

    expect(mailService.send).not.toHaveBeenCalled();
  });
});
