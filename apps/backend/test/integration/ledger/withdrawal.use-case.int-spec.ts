import { LedgerOutboxEntity } from '@domain/ledger/entities/ledger-outbox.entity';
import { LedgerEntryEntity } from '@domain/ledger/entities/ledger.entity';
import { InsufficientFundsError } from '@domain/ledger/errors/insufficient-funds.error';
import {
  LedgerEntryDirection,
  LedgerEntryType,
  LedgerEventType,
} from '@domain/ledger/types';
import { DepositValue } from '@domain/ledger/value-objects/deposit-value';
import { WithdrawalValue } from '@domain/ledger/value-objects/withdrawal-value';
import { WithdrawalUseCase } from '@modules/ledger/use-cases/withdrawal.use-case';
import { LedgerFixture } from 'test/fixtures/ledger-fixture';
import { UsersFixture } from 'test/fixtures/users-fixture';
import { AppTestingFixture } from 'test/helpers/app-testing-fixture';
import { ContextedFn } from 'test/helpers/with-random-correlation-context';
import { Repository } from 'typeorm';

describe('WithdrawalUseCase', () => {
  let testingFixture: AppTestingFixture;
  let usersFixture: UsersFixture;
  let contextedUseCase: ContextedFn<WithdrawalUseCase['execute']>;
  let ledgerRepository: Repository<LedgerEntryEntity>;
  let ledgerOutboxRepository: Repository<LedgerOutboxEntity>;
  let ledgerFixture: LedgerFixture;

  beforeAll(async () => {
    testingFixture = await AppTestingFixture.createWithMocks();
    const useCase = testingFixture.getApp().get(WithdrawalUseCase);

    ledgerRepository = testingFixture.getRepository(LedgerEntryEntity);
    ledgerOutboxRepository = testingFixture.getRepository(LedgerOutboxEntity);
    usersFixture = testingFixture.getUsersFixture();
    ledgerFixture = testingFixture.getLedgerFixture();
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
      await ledgerFixture.initializeForUser(user, new DepositValue(1000));

      await contextedUseCase(user.id, new WithdrawalValue(1000));

      const ledgerEntries = await ledgerRepository.findBy({ userId: user.id });

      expect(ledgerEntries).toHaveLength(2);
      expect(ledgerEntries).toIncludeAllPartialMembers<LedgerEntryEntity[]>([
        {
          id: expect.toBeString(),
          correlationId: expect.toBeString(),
          userId: user.id,
          entryType: LedgerEntryType.WITHDRAWAL,
          direction: LedgerEntryDirection.DEBIT,
          amount: '1000.000000',
          idempotencyKey: expect.toBeString(),
          orderId: null,
          tradeId: null,
          createdAt: expect.toBeDate(),
        },
      ]);

      const ledgerEvents = await ledgerOutboxRepository.findBy({
        userId: user.id,
      });

      expect(ledgerEvents).toHaveLength(2);
      expect(ledgerEvents).toIncludeAllPartialMembers<LedgerOutboxEntity[]>([
        {
          id: expect.toBeString(),
          aggregateId: expect.toBeString(),
          correlationId: expect.toBeString(),
          userId: user.id,
          eventType: LedgerEventType.WITHDRAWN,
          payload: {
            userId: user.id,
            amount: '1000.000000',
          },
          createdAt: expect.toBeDate(),
        },
      ]);
    });

    it('should throw InsufficientFundsError with insufficient funds', async () => {
      const { user } = await usersFixture.createActivatedUser();
      await ledgerFixture.initializeForUser(user, new DepositValue(1));

      await expect(
        contextedUseCase(user.id, new WithdrawalValue(1000)),
      ).rejects.toThrow(InsufficientFundsError);

      await expect(
        ledgerRepository.findBy({
          userId: user.id,
          entryType: LedgerEntryType.WITHDRAWAL,
        }),
      ).resolves.toHaveLength(0);

      await expect(
        ledgerOutboxRepository.findBy({
          userId: user.id,
          eventType: LedgerEventType.WITHDRAWN,
        }),
      ).resolves.toHaveLength(0);
    });

    it('should handle concurrent requests', async () => {
      const { user } = await usersFixture.createActivatedUser();
      await ledgerFixture.initializeForUser(user, new DepositValue(1000));

      await Promise.allSettled([
        contextedUseCase(user.id, new WithdrawalValue(1000)),
        contextedUseCase(user.id, new WithdrawalValue(1000)),
        contextedUseCase(user.id, new WithdrawalValue(1000)),
        contextedUseCase(user.id, new WithdrawalValue(1000)),
        contextedUseCase(user.id, new WithdrawalValue(1000)),
        contextedUseCase(user.id, new WithdrawalValue(1000)),
        contextedUseCase(user.id, new WithdrawalValue(1000)),
        contextedUseCase(user.id, new WithdrawalValue(1000)),
        contextedUseCase(user.id, new WithdrawalValue(1000)),
      ]);

      await expect(
        ledgerRepository.findBy({
          userId: user.id,
          entryType: LedgerEntryType.WITHDRAWAL,
        }),
      ).resolves.toHaveLength(1);

      await expect(
        ledgerOutboxRepository.findBy({
          userId: user.id,
          eventType: LedgerEventType.WITHDRAWN,
        }),
      ).resolves.toHaveLength(1);
    });
  });
});
