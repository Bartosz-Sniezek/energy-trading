import { DepositValue } from '@domain/ledger/value-objects/deposit-value';
import { LedgerUserLocksService } from '@modules/ledger-users-outbox-consumer/ledger-user-locks.service';
import { DepositUseCase } from '@modules/ledger/use-cases/deposit.use-case';
import { UserEntity } from '@modules/users/entities/user.entity';
import { INestApplication } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { App } from 'supertest/types';
import { withCorrelationIdContext } from 'test/helpers/with-correlation-id-context';

export class LedgerFixture {
  private readonly ledgerUserLocksService: LedgerUserLocksService;
  private readonly depositUseCase: DepositUseCase;
  private readonly clsService: ClsService;

  constructor(app: INestApplication<App>) {
    this.ledgerUserLocksService = app.get(LedgerUserLocksService);
    this.depositUseCase = app.get(DepositUseCase);
    this.clsService = app.get(ClsService);
  }

  async initializeForUser(
    user: UserEntity,
    defaultDeposit?: DepositValue,
  ): Promise<void> {
    await withCorrelationIdContext(this.clsService, async () => {
      await this.ledgerUserLocksService.initializeLedgerUserLock(user.id);

      if (defaultDeposit)
        await this.depositUseCase.execute(user.id, defaultDeposit);
    });
  }
}
