import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

export class InvalidAccountActivationResendChallengeError extends DomainError {
  constructor() {
    super(
      'Invalid account activation resend challenge',
      400,
      ErrorCode.INVALID_ACCOUNT_ACTIVATION_RESEND_CHALLENGE,
    );
  }
}
