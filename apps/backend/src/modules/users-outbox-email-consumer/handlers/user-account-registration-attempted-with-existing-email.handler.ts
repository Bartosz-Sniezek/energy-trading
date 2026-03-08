import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { UserOutboxMessageHandler } from '../interfaces/user-outbox-message-handler';
import { DebeziumOutboxMessage } from '../debezium-connector-message.parser';
import { MAIL_SERVICE } from '@technical/mailing/constants';
import type { MailService } from '@technical/mailing/interfaces/mail-service';
import { USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT_EMAIL_TEMPLATE_STRATEGY } from '../constants';
import type { UserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy } from '../interfaces/user-account-registration-attempted-with-existing-email-email-template.strategy';
import { UserAccountRegistrationAttemptedWithExistingAccountEvent } from '../events/user-account-registration-attempted-with-existing-accounter.event';

@Injectable()
export class UserAccountRegistrationAttemptedWithExistingEmaildHandler implements UserOutboxMessageHandler {
  private readonly logger: Logger;
  constructor(
    @Inject(MAIL_SERVICE)
    private readonly mailService: MailService,
    @Inject(
      USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT_EMAIL_TEMPLATE_STRATEGY,
    )
    private readonly emailTemplate: UserAccountRegistrationAttemptedWithExistingAccountEmailTemplateStrategy,
    @Optional() logger?: Logger,
  ) {
    this.logger = logger
      ? logger
      : new Logger(
          UserAccountRegistrationAttemptedWithExistingEmaildHandler.name,
        );
  }

  async handle(data: DebeziumOutboxMessage): Promise<void> {
    this.logger.verbose(data);
    const event =
      UserAccountRegistrationAttemptedWithExistingAccountEvent.parse(data);
    this.logger.verbose(event);
    const template = this.emailTemplate.getTemplate(event);

    await this.mailService.send({
      to: [event.email],
      subject: template.subject,
      html: template.html,
    });
  }
}
