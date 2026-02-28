import { DomainError } from '@domain/errors/domain.error';

export class InvalidRefreshToken extends DomainError {
  constructor() {
    super('Invalid refresh token');
  }
}
