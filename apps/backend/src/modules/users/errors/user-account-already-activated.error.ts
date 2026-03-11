import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

export class UserAccountAlreadyActivatedError extends DomainError {
  constructor() {
    super(
      'User account is already activated',
      400,
      ErrorCode.USER_ACCOUNT_ALREADY_ACTIVATED,
    );
  }
}
