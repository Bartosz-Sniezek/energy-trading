import { Injectable, Logger, Optional } from '@nestjs/common';
import { DebeziumOutboxMessage } from './debezium-connector-message.parser';
import { UserEvents } from '@domain/users/events.enum';
import { UnsupportedEventTypeError } from './errors/unsupported-event-type.error';
import { EventMapper } from './interfaces/event-mapper';
import { UserAccountCreatedEventMapper } from './event-mappers/user-account-created.event-mapper';
import { UserAccountActivatedEventMapper } from './event-mappers/user-account-activated.event-mapper';
import { UserAccountActivationTokenResendRequestedEventMapper } from './event-mappers/user-account-activation-token-resend-requested.event-mapper';
import { UserAccountRegistrationAttemptedWithExistingAccountEventMapper } from './event-mappers/user-account-registration-attempted-with-existing-account.event-mapper';

@Injectable()
export class EventMapperRegistry {
  private readonly mappers: Map<string, EventMapper<unknown>>;
  private readonly logger: Logger;

  constructor(
    userAccountCreatedEventMapper: UserAccountCreatedEventMapper,
    userAccountActivatedEventMapper: UserAccountActivatedEventMapper,
    userAccountActivationTokenResendRequestedEventMapper: UserAccountActivationTokenResendRequestedEventMapper,
    userAccountRegistrationAttemptedWithExistingAccountEventMapper: UserAccountRegistrationAttemptedWithExistingAccountEventMapper,
    @Optional()
    logger?: Logger,
  ) {
    this.logger = logger ? logger : new Logger(EventMapperRegistry.name);
    this.mappers = new Map<string, EventMapper<unknown>>([
      [UserEvents.USER_ACCOUNT_REGISTERED, userAccountCreatedEventMapper],
      [UserEvents.USER_ACCOUNT_ACTIVATED, userAccountActivatedEventMapper],
      [
        UserEvents.USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT,
        userAccountRegistrationAttemptedWithExistingAccountEventMapper,
      ],
      [
        UserEvents.ACTIVATION_TOKEN_RESEND_REQUESTED,
        userAccountActivationTokenResendRequestedEventMapper,
      ],
    ]);
  }

  getMapper(event: DebeziumOutboxMessage): EventMapper<unknown> {
    const mapper = this.mappers.get(event.eventType);

    if (mapper) return mapper;

    const error = new UnsupportedEventTypeError(event.eventType);
    this.logger.error(error.message);

    throw error;
  }
}
