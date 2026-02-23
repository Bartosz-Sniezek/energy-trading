import { Injectable, Logger, Optional } from '@nestjs/common';
import { DebeziumOutboxMessage } from './debezium-connector-message.parser';
import { UserAccountCreatedHandler } from './handlers/user-account-created.handler';
import { UserOutboxMessageHandler } from './interfaces/user-outbox-message-handler';
import { UserEvents } from '@domain/users/events.enum';
import { UnsupportedEventTypeError } from './errors/unsupported-event-type.error';
import { UserAccountActivatedHandler } from './handlers/user-account-activated.handler';

@Injectable()
export class EventHandlerRegistry {
  private readonly handlers: Map<string, UserOutboxMessageHandler>;
  private readonly logger: Logger;

  constructor(
    userAccountCreatedHandler: UserAccountCreatedHandler,
    userAccountActivatedHandler: UserAccountActivatedHandler,
    @Optional()
    logger?: Logger,
  ) {
    this.logger = logger ? logger : new Logger(EventHandlerRegistry.name);
    this.handlers = new Map<string, UserOutboxMessageHandler>([
      [UserEvents.USER_ACCOUNT_REGISTERED, userAccountCreatedHandler],
      [UserEvents.USER_ACCOUNT_ACTIVATED, userAccountActivatedHandler],
    ]);
  }

  async handle(event: DebeziumOutboxMessage): Promise<void> {
    const handler = this.handlers.get(event.eventType);

    if (handler) {
      await handler.handle(event);
    } else {
      const error = new UnsupportedEventTypeError(event.eventType);
      this.logger.error(error.message);

      throw error;
    }
  }
}
