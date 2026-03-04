import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokensTable1772108502206 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await queryRunner.query(`
            CREATE TABLE refresh_tokens (
                id UUID PRIMARY KEY default uuid_generate_v4(),
                user_id UUID NOT NULL,
                token text NOT NULL,
                family text NOT NULL,
                replaced_by UUID REFERENCES refresh_tokens(id),
                revoked_at TIMESTAMP WITH TIME ZONE,
                expires_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            );    
        `);
    await queryRunner.query(
      `CREATE INDEX refresh_tokens_token_idx on refresh_tokens(token);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE refresh_tokens;`);
  }
}
