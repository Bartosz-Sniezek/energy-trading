import { LedgerUserBalanceEntity } from '@domain/ledger/entities/ledger-user-balance.entity';
import { LedgerUserLockEntity } from '@domain/ledger/entities/ledger-user-lock.entity';
import { type UserId } from '@domain/users/types';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { DataSource } from 'typeorm';

@Injectable()
export class LedgerUserStateInitializerService {
  constructor(
    private readonly datetimeService: DatetimeService,
    @InjectDataSource()
    private readonly datasource: DataSource,
  ) {}

  async initializeLedgerUserState(userId: UserId): Promise<void> {
    await this.datasource.transaction(async (entityManager) => {
      await entityManager
        .createQueryBuilder()
        .insert()
        .into(LedgerUserLockEntity)
        .values(LedgerUserLockEntity.create(userId, this.datetimeService.new()))
        .orIgnore()
        .execute();

      await entityManager
        .createQueryBuilder()
        .insert()
        .into(LedgerUserBalanceEntity)
        .values(LedgerUserBalanceEntity.create(userId))
        .orIgnore()
        .execute();
    });
  }
}
