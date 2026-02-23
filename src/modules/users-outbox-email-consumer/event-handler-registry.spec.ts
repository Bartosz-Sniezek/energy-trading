import { mock } from 'vitest-mock-extended';
import { EventHandlerRegistry } from './event-handler-registry';
import { UserAccountCreatedHandler } from './handlers/user-account-created.handler';
import { DebeziumOutboxMessage } from './debezium-connector-message.parser';
import { UserEvents } from '@domain/users/events.enum';
import { loggerMock } from 'test/helpers/logger.mock';
import { UnsupportedEventTypeError } from './errors/unsupported-event-type.error';
import { UserAccountActivatedHandler } from './handlers/user-account-activated.handler';

describe(EventHandlerRegistry.name, () => {
  const userAccountCreatedHandlerMock = mock<UserAccountCreatedHandler>();
  const userAccountActivatedHandlerMock = mock<UserAccountActivatedHandler>();
  const registry = new EventHandlerRegistry(
    userAccountCreatedHandlerMock,
    userAccountActivatedHandlerMock,
    loggerMock,
  );

  describe(registry.handle.name, () => {
    it('should resolve for USER_ACCOUNT_REGISTERED event', async () => {
      const eventMock = mock<DebeziumOutboxMessage>({
        eventType: UserEvents.USER_ACCOUNT_REGISTERED,
      });

      await expect(registry.handle(eventMock)).toResolve();
      expect(userAccountCreatedHandlerMock.handle).toHaveBeenCalledTimes(1);
    });

    it('should resolve for USER_ACCOUNT_REGISTERED event', async () => {
      const eventMock = mock<DebeziumOutboxMessage>({
        eventType: UserEvents.USER_ACCOUNT_ACTIVATED,
      });

      await expect(registry.handle(eventMock)).toResolve();
      expect(userAccountActivatedHandlerMock.handle).toHaveBeenCalledTimes(1);
    });

    it('should throw UnsupportedEventTypeError when event is not supported', async () => {
      const eventMock = mock<DebeziumOutboxMessage>({
        eventType: '__UNSUPPORTED_EVENT__',
      });

      await expect(registry.handle(eventMock)).rejects.toThrow(
        UnsupportedEventTypeError,
      );
    });
  });
});
