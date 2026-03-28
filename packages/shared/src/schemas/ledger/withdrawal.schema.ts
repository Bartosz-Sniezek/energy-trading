import z from "zod";
import { ledgerActionAmountSchema } from "../common/ledger-amount.schema";

export const withdrawalSchema = z.object({
  amount: ledgerActionAmountSchema,
});
