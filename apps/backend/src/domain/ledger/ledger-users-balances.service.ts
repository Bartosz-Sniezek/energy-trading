import { type UserId } from '@modules/users/types';
import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { Decimal } from 'decimal.js';
import { MissingLedgerUserBalanceError } from './errors/missing-ledger-user-balance.error';
import { LedgerUserBalanceEntity } from './entities/ledger-user-balance.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class LedgerUsersBalancesService {
  constructor(
    @InjectRepository(LedgerUserBalanceEntity)
    private readonly repository: Repository<LedgerUserBalanceEntity>,
  ) {}

  async updateBalance(
    entityManager: EntityManager,
    userId: UserId,
    availableDelta: string,
    lockedDelta: string,
  ): Promise<void> {
    await entityManager.query(
      `UPDATE ledger_users_balances SET
        available  = available + $2::numeric,
        locked     = locked    + $3::numeric,
        updated_at = now()
      WHERE user_id = $1`,
      [userId, availableDelta, lockedDelta],
    );
  }

  async canWithdraw(
    manager: EntityManager,
    userId: UserId,
    amount: string,
  ): Promise<boolean> {
    const result = await manager.query<[{ available: string }]>(
      `SELECT available
     FROM ledger_users_balances
     WHERE user_id = $1`,
      [userId],
    );

    if (!result[0]) {
      throw new MissingLedgerUserBalanceError();
    }

    return new Decimal(result[0].available).gte(new Decimal(amount));
  }

  async getBalance(user: UserId): Promise<LedgerUserBalanceEntity | null> {
    return this.repository.findOneBy({
      userId: user,
    });
  }
}
