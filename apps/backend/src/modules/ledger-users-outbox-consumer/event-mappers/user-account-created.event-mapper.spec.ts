import { DebeziumOutboxMessage } from '../../../common/kafka/debezium-connector-message.parser';
import { v7 } from 'uuid';
import { UserEvents } from '@domain/users/events.enum';
import { randomEmail } from 'test/faker/random-email';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { mock, mockReset } from 'vitest-mock-extended';
import { UserAccountCreatedEventMapper } from './user-account-created.event-mapper';
import { randomUUID } from 'crypto';
import { randomCorrelationId } from 'test/faker/random-correlation-id';
import { randomUserId } from 'test/faker/random-user-id';
import { LedgerUserStateInitializerService } from '../ledger-user-state-initializer.service';

describe('UserAccountCreatedEventMapper', () => {
  const ledgerUserLocksServiceMock = mock<LedgerUserStateInitializerService>();

  const mapper = new UserAccountCreatedEventMapper(ledgerUserLocksServiceMock);

  beforeEach(() => {
    mockReset(ledgerUserLocksServiceMock);
  });

  describe('execute', () => {
    it('should create entry', async () => {
      const validMessage: DebeziumOutboxMessage = {
        id: v7(),
        userId: randomUserId(),
        correlationId: randomCorrelationId(),
        aggregateId: v7(),
        timestamp: new Date().toISOString(),
        eventType: UserEvents.USER_ACCOUNT_REGISTERED,
        payload: {
          email: randomEmail().getValue(),
          firstName: randomFirstName(),
          lastName: randomLastName(),
          activationToken: randomUUID(),
          activationTokenExpirationDate: new Date().toISOString(),
        },
      };
      const event = mapper.parse(validMessage);

      await mapper.execute(event);

      expect(
        ledgerUserLocksServiceMock.initializeLedgerUserState,
      ).toHaveBeenCalledWith(event.userId);
    });
  });
});
