import { randomEmail } from 'test/faker/random-email';
import { mock } from 'vitest-mock-extended';
import { EmailTemplate } from '../interfaces/email-template.strategy';
import { UserAccountCreatedEventMapper } from './user-account-created.event-mapper';
import { HtmlUserAccountRegisteredEmailTemplateStrategy } from '../strategies/html-user-account-registered-email-template.strategy';
import { UserAccountCreatedEvent } from '../../../domain/users/events/user-account-created.event';

describe(UserAccountCreatedEventMapper.name, () => {
  const templateMock = mock<HtmlUserAccountRegisteredEmailTemplateStrategy>();
  const mapper = new UserAccountCreatedEventMapper(templateMock);

  describe(mapper.createTemplate.name, () => {
    it('should return template', () => {
      const template: EmailTemplate = {
        to: [randomEmail()],
        html: 'html',
        subject: 'subject',
        text: 'text',
      };

      templateMock.getTemplate.mockReturnValueOnce(template);

      expect(
        mapper.createTemplate(mock<UserAccountCreatedEvent>()),
      ).toMatchObject(template);
      expect(templateMock.getTemplate).toHaveBeenCalledOnce();
    });
  });
});
