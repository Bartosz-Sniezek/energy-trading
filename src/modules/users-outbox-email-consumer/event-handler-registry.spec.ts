import { mock } from 'vitest-mock-extended';
import { EventHandlerRegistry } from './event-handler-registry';
import { UserAccountCreatedHandler } from './handlers/user-account-created.handler';
import { DebeziumOutboxMessage } from './debezium-connector-message.parser';
import { UserEvents } from '@domain/users/events.enum';
import { loggerMock } from 'test/helpers/logger.mock';
import { UnsupportedEventTypeError } from './errors/unsupported-event-type.error';

describe(EventHandlerRegistry.name, () => {
  const userAccountCreatedHandlerMock = mock<UserAccountCreatedHandler>();
  const registry = new EventHandlerRegistry(
    userAccountCreatedHandlerMock,
    loggerMock,
  );

  describe(registry.handle.name, () => {
    it('should resolve when event is supported', async () => {
      const eventMock = mock<DebeziumOutboxMessage>({
        eventType: UserEvents.USER_ACCOUNT_REGISTERED,
      });

      await expect(registry.handle(eventMock)).toResolve();
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
