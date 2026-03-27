import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLedgerTable1774455782100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        -- Ledger table
        CREATE TABLE ledger_entries (
            id                  UUID PRIMARY KEY DEFAULT uuidv7(),
            correlation_id      UUID NOT NULL,
            user_id             UUID NOT NULL,
            order_id            UUID,
            trade_id            UUID,
            entry_type          VARCHAR(20) NOT NULL CONSTRAINT ledger_entry_type_check CHECK (entry_type IN (
                                    'deposit',              -- user adds USD
                                    'withdrawal',           -- user removes USD
                                    'reservation',          -- USD locked for a buy order
                                    'reservation_release',  -- USD unlocked on cancel/expiry
                                    'trade_debit',          -- USD out on buy settlement
                                    'trade_credit',         -- USD in on sell settlement
                                    'fee'                   -- exchange fee deducted
                                )),
            amount              NUMERIC(18, 6) NOT NULL CONSTRAINT ledger_amount_positive CHECK (amount > 0),
            direction           VARCHAR(6) NOT NULL CONSTRAINT direction_check CHECK (direction IN ('debit', 'credit')),
            idempotency_key     UUID NOT NULL UNIQUE,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE INDEX ON ledger_entries (user_id, created_at);
        CREATE INDEX ON ledger_entries (order_id);
        CREATE INDEX ON ledger_entries (trade_id);


        CREATE TABLE ledger_outbox (
            id              UUID PRIMARY KEY DEFAULT uuidv7(),
            correlation_id  UUID NOT NULL,
            aggregate_id    UUID NOT NULL,
            aggregate_type  VARCHAR(255) NOT NULL DEFAULT 'ledger',
            user_id         UUID NOT NULL,
            event_type      VARCHAR(255) NOT NULL,
            payload         JSONB NOT NULL,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX idx_ledger_outbox_created_at ON ledger_outbox(created_at);
        CREATE INDEX idx_ledger_outbox_user_id ON ledger_outbox(user_id);
        CREATE INDEX idx_ledger_outbox_aggregate ON ledger_outbox(aggregate_id, event_type);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
