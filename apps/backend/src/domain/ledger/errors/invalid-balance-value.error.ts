import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

export class InvalidBalanceValueError extends DomainError {
  constructor() {
    super('Invalid balance value', 500, ErrorCode.LEDGER_INVALID_BALANCE);
  }
}
