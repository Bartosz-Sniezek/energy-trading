import { mock, mockReset } from 'vitest-mock-extended';
import { UserAccountCreatedHandler } from './user-account-created.handler';
import { MailService } from '@technical/mailing/interfaces/mail-service';
import { DebeziumOutboxMessage } from '../debezium-connector-message.parser';
import { v7 } from 'uuid';
import { UserEvents } from '@domain/users/events.enum';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { randomToken } from 'test/faker/random-token';
import { randomEmail } from 'test/faker/random-email';
import { Logger } from '@nestjs/common';
import { InvalidEventTypeError } from '@common/errors/invalid-event-type.error';

describe(UserAccountCreatedHandler.name, () => {
  const mailService = mock<MailService>();
  const loggerMock = mock<Logger>();
  const handler = new UserAccountCreatedHandler(mailService, loggerMock);

  beforeEach(() => {
    mockReset(mailService);
    mockReset(loggerMock);
  });

  it(`should successfully execute with valid event data`, async () => {
    const email = randomEmail();
    const activationTokenExpirationDate = new Date().toISOString();
    const activationToken = randomToken();

    const event: DebeziumOutboxMessage = {
      id: v7(),
      aggregateId: v7(),
      eventType: UserEvents.USER_ACCOUNT_REGISTERED,
      timestamp: Date.now().toString(),
      payload: {
        email: email.getValue(),
        firstName: randomFirstName(),
        lastName: randomLastName(),
        activationToken,
        activationTokenExpirationDate,
      },
    };

    await handler.handle(event);

    expect(mailService.send).toHaveBeenCalledWith({
      to: [email],
      subject: 'Account Verification',
      html: `This email is sent to you as part of the process to create your new account. Verification token (valid until: ${activationTokenExpirationDate}): ${activationToken}`,
    });
  });

  it(`should throw with invalid event data`, async () => {
    const event: DebeziumOutboxMessage = {} as any;

    await expect(handler.handle(event)).rejects.toThrow(InvalidEventTypeError);

    expect(mailService.send).not.toHaveBeenCalled();
  });
});
