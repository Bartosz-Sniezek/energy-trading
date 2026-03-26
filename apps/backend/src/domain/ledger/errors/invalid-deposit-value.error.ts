import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

export class InvalidDepositValueError extends DomainError {
  constructor(value: number) {
    super(
      `Invalid deposit value: ${value}`,
      400,
      ErrorCode.LEDGER_INVALID_DEPOSIT_VALUE,
    );
  }
}
