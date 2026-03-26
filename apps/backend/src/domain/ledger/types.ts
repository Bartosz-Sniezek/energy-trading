export type LedgerId = string & { readonly __type: unique symbol };

export enum LedgerEntryType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  RESERVE = 'RESERVE',
  RESERVE_RELEASE = 'RESERVE_RELEASE',
  TRADE_SETTLEMENT = 'TRADE_SETTLEMENT',
}

export enum LedgerReferenceType {
  ORDER = 'ORDER',
  TRADE = 'TRADE',
}
