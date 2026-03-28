import z from "zod";
import { depositSchema } from "../../schemas/ledger/deposit.schema";

export type Deposit = z.infer<typeof depositSchema>;
