import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { UserOutboxMessageHandler } from '../interfaces/user-outbox-message-handler';
import { DebeziumOutboxMessage } from '../debezium-connector-message.parser';
import { UserAccountActivatedEvent } from '../events/user-account-activated.event';
import { MAIL_SERVICE } from '@technical/mailing/constants';
import type { MailService } from '@technical/mailing/interfaces/mail-service';
import { USER_ACCOUNT_ACTIVATED_EMAIL_TEMPLATE } from '../constants';
import type { UserAccountActivatedEmailTemplateStrategy } from '../interfaces/user-account-activated-email-template.strategy';

@Injectable()
export class UserAccountActivatedHandler implements UserOutboxMessageHandler {
  private readonly logger: Logger;
  constructor(
    @Inject(MAIL_SERVICE)
    private readonly mailService: MailService,
    @Inject(USER_ACCOUNT_ACTIVATED_EMAIL_TEMPLATE)
    private readonly emailTemplate: UserAccountActivatedEmailTemplateStrategy,
    @Optional() logger?: Logger,
  ) {
    this.logger = logger
      ? logger
      : new Logger(UserAccountActivatedHandler.name);
  }

  async handle(data: DebeziumOutboxMessage): Promise<void> {
    this.logger.verbose(data);
    const event = UserAccountActivatedEvent.parse(data);
    this.logger.verbose(event);
    const template = this.emailTemplate.getTemplate(event);

    await this.mailService.send({
      to: [event.email],
      subject: template.subject,
      html: template.html,
    });
  }
}
