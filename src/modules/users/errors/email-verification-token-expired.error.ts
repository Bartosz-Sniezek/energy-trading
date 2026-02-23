import { DomainError } from '@domain/errors/domain.error';

export class EmailVerificationTokenExpiredError extends DomainError {
  constructor() {
    super('Email verification token expired');
  }
}
