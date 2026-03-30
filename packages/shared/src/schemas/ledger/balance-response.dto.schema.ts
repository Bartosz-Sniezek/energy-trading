import z from "zod";

export const balanceResponseDtoSchema = z.object({
  available: z.string(),
  locked: z.string(),
});
