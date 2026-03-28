import z from "zod";
import { withdrawalSchema } from "../../schemas/ledger/withdrawal.schema";

export type Withdrawal = z.infer<typeof withdrawalSchema>;
