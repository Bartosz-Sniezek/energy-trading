import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

export class UserDoesNotExistError extends DomainError {
  constructor() {
    super('User does not exist.', 404, ErrorCode.USER_DOES_NOT_EXIST);
  }
}
