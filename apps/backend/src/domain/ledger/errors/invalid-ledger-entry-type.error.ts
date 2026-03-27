import { DomainError } from '@domain/errors/domain.error';
import { LedgerEntryType } from '../types';
import { ErrorCode } from '@energy-trading/shared/errors';

export class InvalidLedgerEntryTypeError extends DomainError {
  constructor(type: LedgerEntryType) {
    super(`Invalid entry type: ${type}`, 500, ErrorCode.LEDGER_INVALID_TYPE);
  }
}
