import { mock } from 'vitest-mock-extended';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { randomToken } from 'test/faker/random-token';
import { randomEmail } from 'test/faker/random-email';
import { HtmlUserAccountActivationTokenResendRequestedTemplateStrategy } from './html-user-account-activation-token-resend-requested-template.strategy';
import { UserAccountActivationTokenResendRequestedEvent } from '../events/user-account-activation-token-resend-requested.event';
import { AppConfig } from '@technical/app-config/app-config';

describe(
  HtmlUserAccountActivationTokenResendRequestedTemplateStrategy.name,
  () => {
    const appConfigMock = mock<AppConfig>();
    const strategy =
      new HtmlUserAccountActivationTokenResendRequestedTemplateStrategy(
        appConfigMock,
      );

    describe(strategy.getTemplate.name, () => {
      it('should return EmailTemplate', () => {
        const eventMock = mock<UserAccountActivationTokenResendRequestedEvent>({
          email: randomEmail(),
          firstName: randomFirstName(),
          lastName: randomLastName(),
          activationToken: randomToken(),
          activationTokenExpirationDate: new Date(),
        });
        const template = strategy.getTemplate(eventMock);

        expect(template.subject).toBe('Activate your account');
        expect(template.to).toIncludeAllMembers([eventMock.email]);
        expect(template.html).toBeString();
        expect(template.text).toBeString();
      });

      it('should return EmailTemplate with first name only if lastname is empty', () => {
        const eventMock = mock<UserAccountActivationTokenResendRequestedEvent>({
          email: randomEmail(),
          firstName: randomFirstName(),
          lastName: '',
          activationToken: randomToken(),
          activationTokenExpirationDate: new Date(),
        });
        const template = strategy.getTemplate(eventMock);

        expect(template.subject).toBe('Activate your account');
        expect(template.to).toIncludeAllMembers([eventMock.email]);
        expect(template.html).toBeString();
        expect(template.text).toBeString();
      });

      it('should return EmailTemplate with last name only if firstName is empty', () => {
        const eventMock = mock<UserAccountActivationTokenResendRequestedEvent>({
          email: randomEmail(),
          firstName: '',
          lastName: randomLastName(),
          activationToken: randomToken(),
          activationTokenExpirationDate: new Date(),
        });
        const template = strategy.getTemplate(eventMock);

        expect(template.subject).toBe('Activate your account');
        expect(template.to).toIncludeAllMembers([eventMock.email]);
        expect(template.html).toBeString();
        expect(template.text).toBeString();
      });
    });
  },
);
