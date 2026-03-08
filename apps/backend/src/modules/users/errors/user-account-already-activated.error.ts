import { DomainError } from '@domain/errors/domain.error';

export class UserAccountAlreadyActivatedError extends DomainError {
  constructor() {
    super('User account is already activated', 400);
  }
}
