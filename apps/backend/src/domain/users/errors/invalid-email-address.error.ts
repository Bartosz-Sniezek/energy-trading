import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

export class InvalidEmailAddressError extends DomainError {
  constructor(value: string) {
    super(
      `Invalid email address: ${value}`,
      400,
      ErrorCode.INVALID_EMAIL_ADDRESS,
    );
  }
}
