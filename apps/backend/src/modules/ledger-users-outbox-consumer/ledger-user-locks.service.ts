import { LedgerUserLockEntity } from '@domain/ledger/entities/ledger-user-lock.entity';
import { type UserId } from '@modules/users/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { Repository } from 'typeorm';

@Injectable()
export class LedgerUserLocksService {
  constructor(
    @InjectRepository(LedgerUserLockEntity)
    private readonly repository: Repository<LedgerUserLockEntity>,
    private readonly datetimeService: DatetimeService,
  ) {}

  async initializeLedgerUserLock(userId: UserId): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .insert()
      .into(LedgerUserLockEntity)
      .values(LedgerUserLockEntity.create(userId, this.datetimeService.new()))
      .orIgnore()
      .execute();
  }
}
