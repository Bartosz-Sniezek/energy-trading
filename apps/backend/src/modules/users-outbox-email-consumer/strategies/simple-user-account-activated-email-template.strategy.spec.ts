import { mock } from 'vitest-mock-extended';
import { UserAccountActivatedEvent } from '../events/user-account-activated.event';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { SimpleUserAccountActivatedEmailTemplateStrategy } from './simple-user-account-activated-email-template.strategy';
import { randomEmail } from 'test/faker/random-email';

describe(SimpleUserAccountActivatedEmailTemplateStrategy.name, () => {
  const strategy = new SimpleUserAccountActivatedEmailTemplateStrategy();

  describe(strategy.getTemplate.name, () => {
    it('should return EmailTemplate', () => {
      const eventMock = mock<UserAccountActivatedEvent>({
        email: randomEmail(),
        firstName: randomFirstName(),
        lastName: randomLastName(),
      });
      const emailHtml = `Hello ${eventMock.firstName} ${eventMock.lastName}! Your account has been activated. You can now log in.`;
      const template = strategy.getTemplate(eventMock);

      expect(template.subject).toBe('Account activated');
      expect(template.to).toIncludeAllMembers([eventMock.email]);
      expect(template.html).toBe(emailHtml);
      expect(template.text).toBe(emailHtml);
    });

    it('should return EmailTemplate with first name only if lastname is empty', () => {
      const eventMock = mock<UserAccountActivatedEvent>({
        email: randomEmail(),
        firstName: randomFirstName(),
        lastName: '',
      });
      const emailHtml = `Hello ${eventMock.firstName}! Your account has been activated. You can now log in.`;
      const template = strategy.getTemplate(eventMock);

      expect(template.subject).toBe('Account activated');
      expect(template.to).toIncludeAllMembers([eventMock.email]);
      expect(template.html).toBe(emailHtml);
      expect(template.text).toBe(emailHtml);
    });

    it('should return EmailTemplate with last name only if firstName is empty', () => {
      const eventMock = mock<UserAccountActivatedEvent>({
        email: randomEmail(),
        firstName: '',
        lastName: randomLastName(),
      });
      const emailHtml = `Hello ${eventMock.lastName}! Your account has been activated. You can now log in.`;
      const template = strategy.getTemplate(eventMock);

      expect(template.subject).toBe('Account activated');
      expect(template.to).toIncludeAllMembers([eventMock.email]);
      expect(template.html).toBe(emailHtml);
      expect(template.text).toBe(emailHtml);
    });
  });
});
