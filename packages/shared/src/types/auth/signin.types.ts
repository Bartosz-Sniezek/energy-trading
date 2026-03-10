import z from "zod";
import { signInDtoSchema } from "../../schemas/auth/signin.schema";

export type SignInDto = z.infer<typeof signInDtoSchema>;
