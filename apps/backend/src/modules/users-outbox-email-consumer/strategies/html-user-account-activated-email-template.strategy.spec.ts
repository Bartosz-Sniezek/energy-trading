import { mock } from 'vitest-mock-extended';
import { UserAccountActivatedEvent } from '../../../domain/users/events/user-account-activated.event';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { HtmlUserAccountActivatedEmailTemplateStrategy } from './html-user-account-activated-email-template.strategy';
import { randomEmail } from 'test/faker/random-email';
import { AppConfig } from '@technical/app-config/app-config';
import { v7 } from 'uuid';
import { userAccountActivatedEmail } from '../html-templates/user-account-activated.layout';
import { randomUserId } from 'test/faker/random-user-id';

describe(HtmlUserAccountActivatedEmailTemplateStrategy.name, () => {
  const appConfigMock = mock<AppConfig>({
    values: {
      FRONTEND_BASE_URL: 'https://example.com',
      COMPANY_NAME: 'Company',
    },
  });
  const strategy = new HtmlUserAccountActivatedEmailTemplateStrategy(
    appConfigMock,
  );

  const eventMock = mock<UserAccountActivatedEvent>({
    id: v7(),
    userId: randomUserId(),
    email: randomEmail(),
    firstName: randomFirstName(),
    lastName: randomLastName(),
    timestamp: Date.now(),
  });
  const htmlTemplate = userAccountActivatedEmail({
    companyName: appConfigMock.values.COMPANY_NAME,
    frontendBaseUrl: appConfigMock.values.FRONTEND_BASE_URL,
    event: eventMock,
  });

  describe(strategy.getTemplate.name, () => {
    it('should return EmailTemplate', () => {
      const template = strategy.getTemplate(eventMock);

      expect(template.subject).toBe('Account activated');
      expect(template.to).toIncludeAllMembers([eventMock.email]);
      expect(template.html).toBe(htmlTemplate);
      expect(template.text).toBe(htmlTemplate);
    });
  });
});
