import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

export class MissingLedgerUserBalanceError extends DomainError {
  constructor() {
    super(
      'Missing ledger user balance',
      500,
      ErrorCode.LEDGER_MISSING_USER_BALANCE,
    );
  }
}
