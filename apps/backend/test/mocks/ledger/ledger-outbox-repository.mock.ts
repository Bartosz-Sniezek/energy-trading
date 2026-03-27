import { LedgerOutboxEntity } from '@domain/ledger/entities/ledger-outbox.entity';
import { Repository } from 'typeorm';
import { mock, MockProxy, mockReset } from 'vitest-mock-extended';

type LedgerOutboxRepositoryMock = MockProxy<Repository<LedgerOutboxEntity>>;

export const createLedgerOutboxRepositoryMock = () => {
  const ledgerOutboxRepositoryMock: LedgerOutboxRepositoryMock =
    mock<Repository<LedgerOutboxEntity>>();

  return {
    ledgerOutboxRepositoryMock,
    resetLedgerOutboxRepositoryMock: () => {
      mockReset(ledgerOutboxRepositoryMock);
    },
  };
};
