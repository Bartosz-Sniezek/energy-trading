import { LedgerOutboxEntity } from '@domain/ledger/entities/ledger-outbox.entity';
import { LedgerUserLockEntity } from '@domain/ledger/entities/ledger-user-lock.entity';
import { LedgerEntryEntity } from '@domain/ledger/entities/ledger.entity';
import { InsufficientFundsError } from '@domain/ledger/errors/insufficient-funds.error';
import { InvalidBalanceValueError } from '@domain/ledger/errors/invalid-balance-value.error';
import { WithdrawalValue } from '@domain/ledger/value-objects/withdrawal-value';
import { UserId } from '@modules/users/types';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';

@Injectable()
export class WithdrawalUseCase {
  constructor(
    private readonly datetimeService: DatetimeService,
    @InjectDataSource()
    private readonly datasource: DataSource,
    private readonly clsSerivce: ClsService,
  ) {}

  async execute(userId: UserId, withdrawal: WithdrawalValue): Promise<void> {
    await this.datasource.transaction(async (entityManager) => {
      const lockRepository = entityManager.getRepository(LedgerUserLockEntity);
      const _lock = await lockRepository.findOne({
        where: {
          userId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      const ledgerRepository = entityManager.getRepository(LedgerEntryEntity);
      const balance = await entityManager
        .createQueryBuilder()
        .from(LedgerEntryEntity, 'l')
        .select(
          `COALESCE(SUM(CASE l.direction WHEN 'credit' THEN l.amount ELSE -l.amount END), 0)`,
          'balance',
        )
        .where('l.user_id = :userId', { userId })
        .execute()
        .then((rows) => parseFloat(rows[0]?.balance));

      if (Number.isNaN(balance)) throw new InvalidBalanceValueError();
      if (balance < withdrawal.amount) throw new InsufficientFundsError();

      const ledgerOutboxRepository =
        entityManager.getRepository(LedgerOutboxEntity);
      const correlationId = this.clsSerivce.getId();

      const withdrawalEntry = LedgerEntryEntity.withdrawal({
        correlationId,
        userId,
        withdrawal,
        createdAt: this.datetimeService.new(),
      });

      await ledgerRepository.save(withdrawalEntry);
      await ledgerOutboxRepository.save(
        LedgerOutboxEntity.withdrawn(withdrawalEntry),
      );
    });
  }
}
