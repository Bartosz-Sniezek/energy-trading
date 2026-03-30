import { MinorUnitValue } from '@domain/ledger/value-objects/minor-unit-value';
import { LedgerUserStateInitializerService } from '@modules/ledger-users-outbox-consumer/ledger-user-state-initializer.service';
import { DepositUseCase } from '@modules/ledger/use-cases/deposit.use-case';
import { UserEntity } from '@modules/users/entities/user.entity';
import { INestApplication } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { App } from 'supertest/types';
import { withCorrelationIdContext } from 'test/helpers/with-correlation-id-context';

export class LedgerFixture {
  private readonly ledgerUserLocksService: LedgerUserStateInitializerService;
  private readonly depositUseCase: DepositUseCase;
  private readonly clsService: ClsService;

  constructor(app: INestApplication<App>) {
    this.ledgerUserLocksService = app.get(LedgerUserStateInitializerService);
    this.depositUseCase = app.get(DepositUseCase);
    this.clsService = app.get(ClsService);
  }

  async initializeForUser(
    user: UserEntity,
    defaultDeposit?: MinorUnitValue,
  ): Promise<void> {
    await withCorrelationIdContext(this.clsService, async () => {
      await this.ledgerUserLocksService.initializeLedgerUserState(user.id);

      if (defaultDeposit)
        await this.depositUseCase.execute(user.id, defaultDeposit);
    });
  }
}
