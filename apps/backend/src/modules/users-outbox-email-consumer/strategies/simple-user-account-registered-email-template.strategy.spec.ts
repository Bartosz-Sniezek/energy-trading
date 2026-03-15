import { mock } from 'vitest-mock-extended';
import { UserAccountCreatedEvent } from '../events/user-account-created.event';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { SimpleUserAccountRegisteredEmailTemplateStrategy } from './simple-user-account-registered-email-template.strategy';
import { randomToken } from 'test/faker/random-token';
import { randomEmail } from 'test/faker/random-email';

describe(SimpleUserAccountRegisteredEmailTemplateStrategy.name, () => {
  const strategy = new SimpleUserAccountRegisteredEmailTemplateStrategy();

  describe(strategy.getTemplate.name, () => {
    it('should return EmailTemplate', () => {
      const eventMock = mock<UserAccountCreatedEvent>({
        email: randomEmail(),
        firstName: randomFirstName(),
        lastName: randomLastName(),
        activationToken: randomToken(),
        activationTokenExpirationDate: new Date(),
      });
      const emailHtml = `Hello ${eventMock.firstName} ${eventMock.lastName}! This email is sent to you as part of the process to create your new account. Verification token (valid until: ${eventMock.activationTokenExpirationDate.toISOString()}): ${eventMock.activationToken}`;
      const template = strategy.getTemplate(eventMock);

      expect(template.subject).toBe('Account Registration');
      expect(template.to).toIncludeAllMembers([eventMock.email]);
      expect(template.html).toBe(emailHtml);
      expect(template.text).toBe(emailHtml);
    });

    it('should return EmailTemplate with first name only if lastname is empty', () => {
      const eventMock = mock<UserAccountCreatedEvent>({
        email: randomEmail(),
        firstName: randomFirstName(),
        lastName: '',
        activationToken: randomToken(),
        activationTokenExpirationDate: new Date(),
      });
      const emailHtml = `Hello ${eventMock.firstName}! This email is sent to you as part of the process to create your new account. Verification token (valid until: ${eventMock.activationTokenExpirationDate.toISOString()}): ${eventMock.activationToken}`;
      const template = strategy.getTemplate(eventMock);

      expect(template.subject).toBe('Account Registration');
      expect(template.to).toIncludeAllMembers([eventMock.email]);
      expect(template.html).toBe(emailHtml);
      expect(template.text).toBe(emailHtml);
    });

    it('should return EmailTemplate with last name only if firstName is empty', () => {
      const eventMock = mock<UserAccountCreatedEvent>({
        email: randomEmail(),
        firstName: '',
        lastName: randomLastName(),
        activationToken: randomToken(),
        activationTokenExpirationDate: new Date(),
      });
      const emailHtml = `Hello ${eventMock.lastName}! This email is sent to you as part of the process to create your new account. Verification token (valid until: ${eventMock.activationTokenExpirationDate.toISOString()}): ${eventMock.activationToken}`;
      const template = strategy.getTemplate(eventMock);

      expect(template.subject).toBe('Account Registration');
      expect(template.to).toIncludeAllMembers([eventMock.email]);
      expect(template.html).toBe(emailHtml);
      expect(template.text).toBe(emailHtml);
    });
  });
});
