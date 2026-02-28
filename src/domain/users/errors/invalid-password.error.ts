import { DomainError } from '@domain/errors/domain.error';

export class InvalidPasswordError extends DomainError {
  constructor(errors: string[]) {
    super(`Invalid password: ${errors.join(', ')}`, 400);
  }
}
