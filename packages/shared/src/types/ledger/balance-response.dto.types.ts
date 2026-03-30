import z from "zod";
import { balanceResponseDtoSchema } from "../../schemas/ledger/balance-response.dto.schema";

export type BalanceReponseDto = z.infer<typeof balanceResponseDtoSchema>;
