import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsersTable1771109993911 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        -- Users table
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT uuidv7(),
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT FALSE,
            activation_token VARCHAR(255) NOT NULL UNIQUE,
            activation_token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        -- Outbox table
        CREATE TABLE users_outbox (
            id UUID PRIMARY KEY DEFAULT uuidv7(),
            aggregate_id UUID NOT NULL,
            aggregate_type VARCHAR(255) NOT NULL DEFAULT 'USER',
            event_type VARCHAR(255) NOT NULL,
            payload JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        -- Indexes
        CREATE INDEX idx_users_email ON users(email);
        CREATE INDEX idx_users_is_active ON users(is_active);
        CREATE INDEX idx_users_activation_token ON users(activation_token);
        CREATE INDEX idx_users_activation_token_expires ON users(activation_token_expires_at);
        CREATE INDEX idx_outbox_created_at ON users_outbox(created_at);
        CREATE INDEX idx_outbox_aggregate ON users_outbox(aggregate_id, event_type);        
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DROP TABLE users_outbox;
        DROP TABLE users;
    `);
  }
}
