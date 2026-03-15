import { mock } from 'vitest-mock-extended';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { HtmlUserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy } from './html-user-account-registration-attempted-with-existing-email-email-template.strategy';
import { UserAccountRegistrationAttemptedWithExistingAccountEvent } from '../events/user-account-registration-attempted-with-existing-accounter.event';
import { randomEmail } from 'test/faker/random-email';
import { AppConfig } from '@technical/app-config/app-config';
import { existingAccountRegistrationEmail } from '../html-templates/existing-account-registration-attempt.layout';
import { v7 } from 'uuid';

describe(
  HtmlUserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy.name,
  () => {
    const appConfig = mock<AppConfig>({
      values: {
        FRONTEND_BASE_URL: 'http://example.com',
        COMPANY_NAME: 'Company',
      },
    });
    const strategy =
      new HtmlUserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy(
        appConfig,
      );
    const subject = `Account Already Exists`;
    const eventMock =
      mock<UserAccountRegistrationAttemptedWithExistingAccountEvent>({
        id: v7(),
        userId: v7(),
        email: randomEmail(),
        firstName: randomFirstName(),
        lastName: randomLastName(),
        timestamp: Date.now(),
      });
    const htmlTemplate = existingAccountRegistrationEmail({
      companyName: appConfig.values.COMPANY_NAME,
      frontendBaseUrl: appConfig.values.FRONTEND_BASE_URL,
      event: eventMock,
    });

    describe(strategy.getTemplate.name, () => {
      it('should return EmailTemplate', () => {
        const template = strategy.getTemplate(eventMock);

        expect(template.subject).toBe(subject);
        expect(template.to).toIncludeAllMembers([eventMock.email]);
        expect(template.html).toBe(htmlTemplate);
        expect(template.text).toBe(htmlTemplate);
      });
    });
  },
);
