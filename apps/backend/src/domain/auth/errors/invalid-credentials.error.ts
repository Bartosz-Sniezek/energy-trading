import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid credentials', 401, ErrorCode.INVALID_CREDENTIALS);
  }
}
