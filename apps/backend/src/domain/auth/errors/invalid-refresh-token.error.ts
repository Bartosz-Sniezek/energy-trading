import { DomainError } from '@domain/errors/domain.error';
import { ErrorCode } from '@energy-trading/shared/errors';

export class InvalidRefreshToken extends DomainError {
  constructor(readonly family?: string) {
    super('Invalid refresh token', 401, ErrorCode.INVALID_REFRESH_TOKEN);
  }
}
