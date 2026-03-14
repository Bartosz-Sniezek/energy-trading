import { ErrorCode } from '@energy-trading/shared/errors';

export class DomainError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly errorCode: ErrorCode,
  ) {
    super(message);
  }

  getProperties(): Record<string, string> | undefined {
    return undefined;
  }
}
