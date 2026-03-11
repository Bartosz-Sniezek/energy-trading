import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

export class InvalidPasswordError extends DomainError {
  constructor(errors: string[]) {
    super(
      `Invalid password: ${errors.join(', ')}`,
      400,
      ErrorCode.INVALID_PASSWORD,
    );
  }
}
