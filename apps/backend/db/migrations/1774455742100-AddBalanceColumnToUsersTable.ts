import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBalanceColumnToUsersTable1774455742100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE users ADD COLUMN balance NUMERIC(16, 4) NOT NULL DEFAULT 0 CONSTRAINT balance_non_negative CHECK (balance >= 0);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN balance`);
  }
}
