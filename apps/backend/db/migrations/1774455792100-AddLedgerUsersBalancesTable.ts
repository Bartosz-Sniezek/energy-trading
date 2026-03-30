import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLedgerUsersBalancesTable1774455792100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        -- Balance projection table
        CREATE TABLE ledger_users_balances (
            user_id         UUID PRIMARY KEY,
            available       NUMERIC(18, 6) DEFAULT 0,
            locked          NUMERIC(18, 6) DEFAULT 0,
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

            CONSTRAINT available_non_negative CHECK (available >= 0),
            CONSTRAINT locked_non_negative CHECK (locked >= 0)
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE ledger_users_balances`);
  }
}
