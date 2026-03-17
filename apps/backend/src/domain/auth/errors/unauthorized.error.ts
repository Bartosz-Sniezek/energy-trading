import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

export class UnauthorizedError extends DomainError {
  constructor() {
    super('Unauthorized', 401, ErrorCode.UNAUTHORIZED);
  }
}
