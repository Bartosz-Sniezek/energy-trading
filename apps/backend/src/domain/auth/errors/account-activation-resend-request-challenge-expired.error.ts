import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

export class AccountActivationResendRequestChallengeExpiredError extends DomainError {
  constructor() {
    super(
      'Challenge token expired',
      400,
      ErrorCode.ACCOUNT_ACTIVATION_RESEND_REQUEST_CHALLENGE_EXPIRED,
    );
  }
}
