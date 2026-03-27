import { LedgerEntryEntity } from '@domain/ledger/entities/ledger.entity';
import { Repository } from 'typeorm';
import { mock, MockProxy, mockReset } from 'vitest-mock-extended';

type LedgerRepositoryMock = MockProxy<Repository<LedgerEntryEntity>>;

export const createLedgerRepositoryMock = () => {
  const ledgerRepositoryMock: LedgerRepositoryMock =
    mock<Repository<LedgerEntryEntity>>();

  return {
    ledgerRepositoryMock,
    resetLedgerRepositoryMock: () => {
      mockReset(ledgerRepositoryMock);
    },
  };
};
