import { mock } from 'vitest-mock-extended';
import { DebeziumOutboxMessage } from './debezium-connector-message.parser';
import { UserEvents } from '@domain/users/events.enum';
import { loggerMock } from 'test/helpers/logger.mock';
import { UnsupportedEventTypeError } from './errors/unsupported-event-type.error';
import { EventMapperRegistry } from './event-mapper-registry';
import { UserAccountActivatedEventMapper } from './event-mappers/user-account-activated.event-mapper';
import { UserAccountActivationTokenResendRequestedEventMapper } from './event-mappers/user-account-activation-token-resend-requested.event-mapper';
import { UserAccountCreatedEventMapper } from './event-mappers/user-account-created.event-mapper';
import { UserAccountRegistrationAttemptedWithExistingAccountEventMapper } from './event-mappers/user-account-registration-attempted-with-existing-account.event-mapper';

describe(EventMapperRegistry.name, () => {
  const userAccountCreatedEventMapper = mock<UserAccountCreatedEventMapper>();
  const userAccountActivatedEventMapper =
    mock<UserAccountActivatedEventMapper>();
  const userAccountActivationTokenResendRequestedEventMapper =
    mock<UserAccountActivationTokenResendRequestedEventMapper>();
  const userAccountRegistrationAttemptedWithExistingAccountEventMapper =
    mock<UserAccountRegistrationAttemptedWithExistingAccountEventMapper>();
  const registry = new EventMapperRegistry(
    userAccountCreatedEventMapper,
    userAccountActivatedEventMapper,
    userAccountActivationTokenResendRequestedEventMapper,
    userAccountRegistrationAttemptedWithExistingAccountEventMapper,
    loggerMock,
  );

  describe(registry.getMapper.name, () => {
    it('should resolve for USER_ACCOUNT_REGISTERED event', async () => {
      const eventMock = mock<DebeziumOutboxMessage>({
        eventType: UserEvents.USER_ACCOUNT_REGISTERED,
      });

      expect(registry.getMapper(eventMock)).toBe(userAccountCreatedEventMapper);
    });

    it('should resolve for USER_ACCOUNT_ACTIVATED event', async () => {
      const eventMock = mock<DebeziumOutboxMessage>({
        eventType: UserEvents.USER_ACCOUNT_ACTIVATED,
      });

      expect(registry.getMapper(eventMock)).toBe(
        userAccountActivatedEventMapper,
      );
    });

    it('should resolve for USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT event', async () => {
      const eventMock = mock<DebeziumOutboxMessage>({
        eventType:
          UserEvents.USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT,
      });

      expect(registry.getMapper(eventMock)).toBe(
        userAccountRegistrationAttemptedWithExistingAccountEventMapper,
      );
    });

    it('should resolve for ACTIVATION_TOKEN_RESEND_REQUESTED event', async () => {
      const eventMock = mock<DebeziumOutboxMessage>({
        eventType: UserEvents.ACTIVATION_TOKEN_RESEND_REQUESTED,
      });

      expect(registry.getMapper(eventMock)).toBe(
        userAccountActivationTokenResendRequestedEventMapper,
      );
    });

    it('should throw UnsupportedEventTypeError when event is not supported', async () => {
      const eventMock = mock<DebeziumOutboxMessage>({
        eventType: '__UNSUPPORTED_EVENT__',
      });

      expect(() => registry.getMapper(eventMock)).toThrow(
        UnsupportedEventTypeError,
      );
    });
  });
});
