import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

export class InsufficientFundsError extends DomainError {
  constructor() {
    super('Insufficient funds', 400, ErrorCode.LEDGER_INSUFFICIENT_FUNDS);
  }
}
