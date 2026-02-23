import { DomainError } from '@domain/errors/domain.error';

export class InvalidEmailAddressError extends DomainError {
  constructor(value: string) {
    super(`Invalid email address: ${value}`);
  }
}
