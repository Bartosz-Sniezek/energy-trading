import { LedgerUserLockEntity } from '@domain/ledger/entities/ledger-user-lock.entity';
import { Repository } from 'typeorm';
import { mock, MockProxy, mockReset } from 'vitest-mock-extended';

type LedgerUserLockRepositoryMock = MockProxy<Repository<LedgerUserLockEntity>>;

export const createLedgerUserLockRepositoryMock = () => {
  const ledgerUserLockRepositoryMock: LedgerUserLockRepositoryMock =
    mock<Repository<LedgerUserLockEntity>>();

  return {
    ledgerUserLockRepositoryMock,
    resetLedgerUserLockRepositoryMock: () => {
      mockReset(ledgerUserLockRepositoryMock);
    },
  };
};
