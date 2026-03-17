import z from "zod";

export const meDtoSchema = z.object({
  id: z.uuidv7(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});
