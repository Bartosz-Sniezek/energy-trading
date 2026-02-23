import { mock } from 'vitest-mock-extended';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { SimpleUserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy } from './simple-user-account-registration-attempted-with-existing-email-email-template.strategy';
import { UserAccountRegistrationAttemptedWithExistingAccountEvent } from '../events/user-account-registration-attempted-with-existing-accounter.event';

describe(
  SimpleUserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy.name,
  () => {
    const strategy =
      new SimpleUserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy();
    const subject = `Account Already Exists`;

    describe(strategy.getTemplate.name, () => {
      it('should return EmailTemplate', () => {
        const eventMock =
          mock<UserAccountRegistrationAttemptedWithExistingAccountEvent>({
            firstName: randomFirstName(),
            lastName: randomLastName(),
          });
        const emailHtml = `Hello ${eventMock.firstName} ${eventMock.lastName}! We noticed you tried to create an account with us, but it looks like an account with this email address already exists. If you forgot your password, you can reset it here: [Reset Password Link]`;
        const template = strategy.getTemplate(eventMock);

        expect(template.subject).toBe(subject);
        expect(template.html).toBe(emailHtml);
        expect(template.text).toBe(emailHtml);
      });

      it('should return EmailTemplate with first name only if lastname is empty', () => {
        const eventMock =
          mock<UserAccountRegistrationAttemptedWithExistingAccountEvent>({
            firstName: randomFirstName(),
            lastName: '',
          });
        const emailHtml = `Hello ${eventMock.firstName}! We noticed you tried to create an account with us, but it looks like an account with this email address already exists. If you forgot your password, you can reset it here: [Reset Password Link]`;
        const template = strategy.getTemplate(eventMock);

        expect(template.subject).toBe(subject);
        expect(template.html).toBe(emailHtml);
        expect(template.text).toBe(emailHtml);
      });

      it('should return EmailTemplate with last name only if firstName is empty', () => {
        const eventMock =
          mock<UserAccountRegistrationAttemptedWithExistingAccountEvent>({
            firstName: '',
            lastName: randomLastName(),
          });
        const emailHtml = `Hello ${eventMock.lastName}! We noticed you tried to create an account with us, but it looks like an account with this email address already exists. If you forgot your password, you can reset it here: [Reset Password Link]`;
        const template = strategy.getTemplate(eventMock);

        expect(template.subject).toBe(subject);
        expect(template.html).toBe(emailHtml);
        expect(template.text).toBe(emailHtml);
      });
    });
  },
);
