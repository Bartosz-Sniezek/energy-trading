import { LedgerOutboxEntity } from '@domain/ledger/entities/ledger-outbox.entity';
import { LedgerEntryEntity } from '@domain/ledger/entities/ledger.entity';
import { DepositValue } from '@domain/ledger/value-objects/deposit-value';
import { UserDoesNotExistError } from '@domain/users/errors/user-does-not-exist.error';
import { UserEntity } from '@modules/users/entities/user.entity';
import { UserId } from '@modules/users/types';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';

@Injectable()
export class DepositUseCase {
  constructor(
    private readonly datetimeService: DatetimeService,
    @InjectDataSource()
    private readonly datasource: DataSource,
    private readonly clsSerivce: ClsService,
  ) {}

  async execute(userId: UserId, deposit: DepositValue): Promise<void> {
    await this.datasource.transaction(async (entityManager) => {
      const userRepository = entityManager.getRepository(UserEntity);
      const user = await userRepository.findOne({
        where: {
          id: userId,
          isActive: true,
        },
      });

      if (user == null) throw new UserDoesNotExistError();

      const ledgerRepository = entityManager.getRepository(LedgerEntryEntity);
      const ledgerOutboxRepository =
        entityManager.getRepository(LedgerOutboxEntity);
      const correlationId = this.clsSerivce.getId();

      const depositEntry = LedgerEntryEntity.deposit({
        correlationId,
        userId,
        deposit,
        createdAt: this.datetimeService.new(),
      });
      await ledgerRepository.save(depositEntry);
      await ledgerOutboxRepository.save(
        LedgerOutboxEntity.deposited(depositEntry),
      );
    });
  }
}
