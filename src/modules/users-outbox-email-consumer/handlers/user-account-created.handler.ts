import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { UserOutboxMessageHandler } from '../interfaces/user-outbox-message-handler';
import { DebeziumOutboxMessage } from '../debezium-connector-message.parser';
import { UserAccountCreatedEvent } from '../events/user-account-created.event';
import { MAIL_SERVICE } from '@technical/mailing/constants';
import type { MailService } from '@technical/mailing/interfaces/mail-service';

@Injectable()
export class UserAccountCreatedHandler implements UserOutboxMessageHandler {
  private readonly logger: Logger;
  constructor(
    @Inject(MAIL_SERVICE)
    private readonly mailService: MailService,
    @Optional() logger?: Logger,
  ) {
    this.logger = logger ? logger : new Logger(UserAccountCreatedHandler.name);
  }

  async handle(data: DebeziumOutboxMessage): Promise<void> {
    this.logger.verbose(data);
    const event = UserAccountCreatedEvent.parse(data);
    this.logger.verbose(event);

    await this.mailService.send({
      to: [event.email],
      subject: 'Account Verification',
      html: `This email is sent to you as part of the process to create your new account. Verification token (valid until: ${event.activationTokenExpirationDate.toISOString()}): ${event.activationToken}`,
    });
  }
}
