import { LedgerOutboxEntity } from '@domain/ledger/entities/ledger-outbox.entity';
import { LedgerUserLockEntity } from '@domain/ledger/entities/ledger-user-lock.entity';
import { LedgerEntryEntity } from '@domain/ledger/entities/ledger.entity';
import { InsufficientFundsError } from '@domain/ledger/errors/insufficient-funds.error';
import { MinorUnitValue } from '@domain/ledger/value-objects/minor-unit-value';
import { LedgerUsersBalancesService } from '@domain/ledger/ledger-users-balances.service';
import { UserId } from '@domain/users/types';
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
    private readonly ledgerUserBalancesService: LedgerUsersBalancesService,
  ) {}

  async execute(userId: UserId, value: MinorUnitValue): Promise<void> {
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
      const canWithdraw = await this.ledgerUserBalancesService.canWithdraw(
        entityManager,
        userId,
        value.toLedgerFormat(),
      );

      if (!canWithdraw) throw new InsufficientFundsError();

      const ledgerOutboxRepository =
        entityManager.getRepository(LedgerOutboxEntity);
      const correlationId = this.clsSerivce.getId();

      const withdrawalEntry = LedgerEntryEntity.withdrawal({
        correlationId,
        userId,
        value,
        createdAt: this.datetimeService.new(),
      });

      await ledgerRepository.save(withdrawalEntry);
      await ledgerOutboxRepository.save(
        LedgerOutboxEntity.withdrawn(withdrawalEntry),
      );
      await this.ledgerUserBalancesService.updateBalance(
        entityManager,
        userId,
        `-${withdrawalEntry.amount}`,
        '0',
      );
    });
  }
}
