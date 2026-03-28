import { Module } from '@nestjs/common';
import { DatetimeModule } from '@technical/datetime/datetime.module';
import { DepositUseCase } from './use-cases/deposit.use-case';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerEntryEntity } from '@domain/ledger/entities/ledger.entity';
import { LedgerOutboxEntity } from '@domain/ledger/entities/ledger-outbox.entity';
import { WithdrawalUseCase } from './use-cases/withdrawal.use-case';

@Module({
  imports: [
    DatetimeModule,
    TypeOrmModule.forFeature([LedgerEntryEntity, LedgerOutboxEntity]),
  ],
  providers: [DepositUseCase, WithdrawalUseCase],
})
export class LedgerModule {}
