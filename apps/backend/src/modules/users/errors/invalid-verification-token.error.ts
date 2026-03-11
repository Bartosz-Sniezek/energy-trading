import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

export class InvalidVerificationTokenError extends DomainError {
  constructor() {
    super(
      'Invalid verification token',
      400,
      ErrorCode.INVALID_VERIFICATION_TOKEN,
    );
  }
}
