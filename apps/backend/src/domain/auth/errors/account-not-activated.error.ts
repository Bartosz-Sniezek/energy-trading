import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

type ResendChallengeOptions = {
  challenge: string;
  expirationDate: Date;
};

export class AccountNotActivatedError extends DomainError {
  constructor(readonly options?: ResendChallengeOptions) {
    super('Account not activated', 400, ErrorCode.USER_ACCOUNT_NOT_ACTIVATED);
  }

  getProperties(): Record<string, string> | undefined {
    if (this.options == null) return undefined;

    return {
      challenge: this.options.challenge,
      expirationDate: this.options.expirationDate.toISOString(),
    };
  }
}
