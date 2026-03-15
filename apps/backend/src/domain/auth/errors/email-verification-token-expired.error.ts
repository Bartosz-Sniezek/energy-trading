import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

export class EmailVerificationTokenExpiredError extends DomainError {
  constructor() {
    super(
      'Email verification token expired',
      400,
      ErrorCode.USER_ACCOUNT_VERIFICATION_TOKEN_EXPIRED,
    );
  }
}
