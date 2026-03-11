import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

export class AccountNotActivatedError extends DomainError {
  constructor() {
    super(
      'Account not activated error',
      400,
      ErrorCode.USER_ACCOUNT_NOT_ACTIVATED,
    );
  }
}
