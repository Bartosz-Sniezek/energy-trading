import { mock } from 'vitest-mock-extended';
import { UserAccountCreatedEvent } from '../events/user-account-created.event';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { HtmlUserAccountRegisteredEmailTemplateStrategy } from './html-user-account-registered-email-template.strategy';
import { randomToken } from 'test/faker/random-token';
import { randomEmail } from 'test/faker/random-email';
import { AppConfig } from '@technical/app-config/app-config';
import { userAccountCreatedEmail } from '../html-templates/user-account-created.layout';
import { v7 } from 'uuid';

describe(HtmlUserAccountRegisteredEmailTemplateStrategy.name, () => {
  const appConfig = mock<AppConfig>({
    values: {
      FRONTEND_BASE_URL: 'http://example.com',
      COMPANY_NAME: 'Company',
    },
  });
  const strategy = new HtmlUserAccountRegisteredEmailTemplateStrategy(
    appConfig,
  );
  const eventMock = mock<UserAccountCreatedEvent>({
    id: v7(),
    userId: v7(),
    email: randomEmail(),
    firstName: randomFirstName(),
    lastName: randomLastName(),
    activationToken: randomToken(),
    activationTokenExpirationDate: new Date(),
    timestamp: Date.now(),
  });
  const htmlTemplate = userAccountCreatedEmail({
    companyName: appConfig.values.COMPANY_NAME,
    frontendBaseUrl: appConfig.values.FRONTEND_BASE_URL,
    event: eventMock,
  });

  describe(strategy.getTemplate.name, () => {
    it('should return EmailTemplate', () => {
      const template = strategy.getTemplate(eventMock);

      expect(template.subject).toBe('Account Registration');
      expect(template.to).toIncludeAllMembers([eventMock.email]);
      expect(template.html).toBe(htmlTemplate);
      expect(template.text).toBe(htmlTemplate);
    });
  });
});
