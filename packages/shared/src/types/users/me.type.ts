import z from "zod";
import { meDtoSchema } from "../../schemas";

export type MeDto = z.infer<typeof meDtoSchema>;
