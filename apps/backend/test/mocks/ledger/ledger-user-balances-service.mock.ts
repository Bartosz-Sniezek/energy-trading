import { LedgerUsersBalancesService } from '@domain/ledger/ledger-users-balances.service';
import { mock, mockReset } from 'vitest-mock-extended';

export const createLedgerUserBalancesService = () => {
  const ledgerUserBalancesServiceMock = mock<LedgerUsersBalancesService>();

  return {
    ledgerUserBalancesServiceMock,
    resetLedgerUserBalancesService: () => {
      mockReset(ledgerUserBalancesServiceMock);
    },
  };
};
