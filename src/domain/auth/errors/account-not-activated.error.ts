import { DomainError } from '@domain/errors/domain.error';

export class AccountNotActivatedError extends DomainError {
  constructor() {
    super('Account not activated error', 400);
  }
}
