import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

export class InvalidWithdrawalValueError extends DomainError {
  constructor(value: number) {
    super(
      `Invalid withdrawal value: ${value}`,
      400,
      ErrorCode.LEDGER_INVALID_WITHDRAWAL_VALUE,
    );
  }
}
