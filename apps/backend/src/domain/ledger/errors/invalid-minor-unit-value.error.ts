import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

export class InvalidMinorUnitValueError extends DomainError {
  constructor(value: number) {
    super(
      `Invalid base monetary value: ${value}`,
      400,
      ErrorCode.INVALID_MINOR_UNIT_VALUE,
    );
  }
}
