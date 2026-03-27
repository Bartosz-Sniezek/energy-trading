import z from 'zod';

export type LedgerEntryId = string & { readonly __type: unique symbol };

export enum LedgerEntryType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  RESERVE = 'reserve',
  RESERVE_RELEASE = 'reserve_release',
  TRADE_DEBIT = 'trade_debit',
  TRADE_CREDIT = 'trade_credit',
  FEE = 'fee',
}

export enum LedgerEntryDirection {
  'DEBIT' = 'debit',
  'CREDIT' = 'credit',
}

export enum LedgerEventType {
  DEPOSITED = 'deposited',
  WITHDRAWN = 'withdrawn',
  RESERVED = 'reserved',
  RESERVE_RELEASED = 'reserve_released',
  TRADE_DEBITED = 'trade_debited',
  TRADE_CREDITED = 'trade_credited',
  FEE_CHARGED = 'fee_charged',
}

const ledgerOutboxBasePayloadSchema = z.object({
  userId: z.uuidv7(),
  amount: z
    .string()
    .regex(/^\d*\.?\d+$/)
    .refine((val) => parseFloat(val) > 0, {
      message: 'Must be a positive numeric value',
    }),
});

export const depositedLedgerPayloadSchema = ledgerOutboxBasePayloadSchema;

export const withdrawnLedgerPayloadSchema = ledgerOutboxBasePayloadSchema;

export type DepositedLedgerPayload = z.infer<
  typeof depositedLedgerPayloadSchema
>;
export type WithdrawnLedgerPayload = z.infer<
  typeof depositedLedgerPayloadSchema
>;

export type LedgerOutboxPayload =
  // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
  | DepositedLedgerPayload
  // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
  | WithdrawnLedgerPayload;
