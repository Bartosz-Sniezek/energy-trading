import z from "zod";
import { ledgerActionAmountSchema } from "../common/ledger-amount.schema";

export const depositSchema = z.object({
  amount: ledgerActionAmountSchema,
});
