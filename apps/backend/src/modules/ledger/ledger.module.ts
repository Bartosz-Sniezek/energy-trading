import { Module } from '@nestjs/common';
import { DatetimeModule } from '@technical/datetime/datetime.module';
import { DepositUseCase } from './use-cases/deposit.use-case';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerEntryEntity } from '@domain/ledger/entities/ledger.entity';
import { LedgerOutboxEntity } from '@domain/ledger/entities/ledger-outbox.entity';
import { WithdrawalUseCase } from './use-cases/withdrawal.use-case';
import { LedgerController } from './controllers/ledger.controller';
import { JwtAuthModule } from '@modules/jwt-auth/jwt-auth.module';

@Module({
  imports: [
    JwtAuthModule,
    DatetimeModule,
    TypeOrmModule.forFeature([LedgerEntryEntity, LedgerOutboxEntity]),
  ],
  providers: [DepositUseCase, WithdrawalUseCase],
  controllers: [LedgerController],
})
export class LedgerModule {}
