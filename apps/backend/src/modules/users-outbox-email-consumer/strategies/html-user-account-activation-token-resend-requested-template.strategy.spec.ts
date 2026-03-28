import { mock } from 'vitest-mock-extended';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { randomToken } from 'test/faker/random-token';
import { randomEmail } from 'test/faker/random-email';
import { HtmlUserAccountActivationTokenResendRequestedTemplateStrategy } from './html-user-account-activation-token-resend-requested-template.strategy';
import { UserAccountActivationTokenResendRequestedEvent } from '../../../domain/users/events/user-account-activation-token-resend-requested.event';
import { AppConfig } from '@technical/app-config/app-config';
import { userAccountActivationTokenResentEmail } from '../html-templates/user-account-activation-token-resend-requested.layout';
import { v7 } from 'uuid';
import { randomUserId } from 'test/faker/random-user-id';

describe(
  HtmlUserAccountActivationTokenResendRequestedTemplateStrategy.name,
  () => {
    const appConfigMock = mock<AppConfig>({
      values: {
        FRONTEND_BASE_URL: 'http://example.com',
        COMPANY_NAME: 'Company',
      },
    });
    const strategy =
      new HtmlUserAccountActivationTokenResendRequestedTemplateStrategy(
        appConfigMock,
      );
    const eventMock = mock<UserAccountActivationTokenResendRequestedEvent>({
      id: v7(),
      userId: randomUserId(),
      email: randomEmail(),
      firstName: randomFirstName(),
      lastName: randomLastName(),
      activationToken: randomToken(),
      activationTokenExpirationDate: new Date(),
      timestamp: Date.now(),
    });

    const htmlTemplate = userAccountActivationTokenResentEmail({
      companyName: appConfigMock.values.COMPANY_NAME,
      frontendBaseUrl: appConfigMock.values.FRONTEND_BASE_URL,
      event: eventMock,
    });

    describe(strategy.getTemplate.name, () => {
      it('should return EmailTemplate', () => {
        const template = strategy.getTemplate(eventMock);

        expect(template.subject).toBe('Activate your account');
        expect(template.to).toIncludeAllMembers([eventMock.email]);
        expect(template.html).toBe(htmlTemplate);
        expect(template.text).toBe(htmlTemplate);
      });
    });
  },
);
