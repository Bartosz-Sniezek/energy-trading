import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

export class AlreadyAuthenticatedError extends DomainError {
  constructor() {
    super('Already authenticated', 400, ErrorCode.ALREADY_AUTHENTICATED);
  }
}
