import { DomainError } from '@domain/errors/domain.error';

export class InvalidVerificationTokenError extends DomainError {
  constructor() {
    super('Invalid verification token');
  }
}
