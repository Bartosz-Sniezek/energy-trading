import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { UserOutboxMessageHandler } from '../interfaces/user-outbox-message-handler';
import { DebeziumOutboxMessage } from '../debezium-connector-message.parser';
import { UserAccountCreatedEvent } from '../events/user-account-created.event';
import { MAIL_SERVICE } from '@technical/mailing/constants';
import type { MailService } from '@technical/mailing/interfaces/mail-service';
import { USER_ACCOUNT_REGISTERED_EMAIL_TEMPLATE } from '../constants';
import type { UserAccountRegisteredEmailTemplateStrategy } from '../interfaces/user-account-registered-email-template.strategy';

@Injectable()
export class UserAccountCreatedHandler implements UserOutboxMessageHandler {
  private readonly logger: Logger;
  constructor(
    @Inject(MAIL_SERVICE)
    private readonly mailService: MailService,
    @Inject(USER_ACCOUNT_REGISTERED_EMAIL_TEMPLATE)
    private readonly emailTemplateStrategy: UserAccountRegisteredEmailTemplateStrategy,
    @Optional()
    logger?: Logger,
  ) {
    this.logger = logger ? logger : new Logger(UserAccountCreatedHandler.name);
  }

  async handle(data: DebeziumOutboxMessage): Promise<void> {
    this.logger.verbose(data);
    const event = UserAccountCreatedEvent.parse(data);
    this.logger.verbose(event);
    const template = this.emailTemplateStrategy.getTemplate(event);
    await this.mailService.send({
      to: [event.email],
      subject: template.subject,
      html: template.html,
    });
  }
}
