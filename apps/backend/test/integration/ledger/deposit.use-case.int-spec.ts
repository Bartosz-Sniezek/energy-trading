import { LedgerOutboxEntity } from '@domain/ledger/entities/ledger-outbox.entity';
import { LedgerEntryEntity } from '@domain/ledger/entities/ledger.entity';
import {
  LedgerEntryDirection,
  LedgerEntryType,
  LedgerEventType,
} from '@domain/ledger/types';
import { MinorUnitValue } from '@domain/ledger/value-objects/minor-unit-value';
import { DepositUseCase } from '@modules/ledger/use-cases/deposit.use-case';
import { UsersFixture } from 'test/fixtures/users-fixture';
import { AppTestingFixture } from 'test/helpers/app-testing-fixture';
import { ContextedFn } from 'test/helpers/with-random-correlation-context';
import { Repository } from 'typeorm';

describe('DeposiUseCase', () => {
  let testingFixture: AppTestingFixture;
  let usersFixture: UsersFixture;
  let contextedUseCase: ContextedFn<DepositUseCase['execute']>;
  let ledgerRepository: Repository<LedgerEntryEntity>;
  let ledgerOutboxRepository: Repository<LedgerOutboxEntity>;

  beforeAll(async () => {
    testingFixture = await AppTestingFixture.createWithMocks();
    const useCase = testingFixture.getApp().get(DepositUseCase);

    ledgerRepository = testingFixture.getRepository(LedgerEntryEntity);
    ledgerOutboxRepository = testingFixture.getRepository(LedgerOutboxEntity);
    usersFixture = testingFixture.getUsersFixture();
    contextedUseCase = testingFixture.contextedCorrelationIdExecution(
      useCase.execute.bind(useCase),
    );
  });

  afterAll(async () => {
    await testingFixture.close();
  });

  describe('execute', () => {
    it('should deposit successfully for active user', async () => {
      const { user } = await usersFixture.createActivatedUser();

      await contextedUseCase(user.id, new MinorUnitValue(1000));

      const ledgerEntries = await ledgerRepository.findBy({ userId: user.id });

      expect(ledgerEntries).toHaveLength(1);
      expect(ledgerEntries[0]).toMatchObject<LedgerEntryEntity>({
        id: expect.toBeString(),
        correlationId: expect.toBeString(),
        userId: user.id,
        entryType: LedgerEntryType.DEPOSIT,
        direction: LedgerEntryDirection.CREDIT,
        amount: '10.000000',
        idempotencyKey: expect.toBeString(),
        orderId: null,
        tradeId: null,
        createdAt: expect.toBeDate(),
      });

      const ledgerEvents = await ledgerOutboxRepository.findBy({
        userId: user.id,
      });

      expect(ledgerEvents).toHaveLength(1);
      expect(ledgerEvents).toIncludeAllMembers(
        ledgerEntries.map((entry) =>
          expect.objectContaining<LedgerOutboxEntity>({
            id: expect.toBeString(),
            aggregateId: entry.id,
            correlationId: entry.correlationId,
            userId: entry.userId,
            eventType: LedgerEventType.DEPOSITED,
            payload: {
              userId: entry.userId,
              amount: entry.amount,
            },
            createdAt: expect.toBeDate(),
          }),
        ),
      );
    });
  });
});
