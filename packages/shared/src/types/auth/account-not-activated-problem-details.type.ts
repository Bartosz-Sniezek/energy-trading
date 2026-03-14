import z from "zod";
import { accountNotActivatedProblemDetailsSchema } from "../../schemas/auth/account-not-activated-problem-details.schema";

export type AccountNotActivatedProblemDetails = z.infer<
  typeof accountNotActivatedProblemDetailsSchema
>;
