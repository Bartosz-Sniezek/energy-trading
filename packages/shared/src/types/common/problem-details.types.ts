import z from "zod";
import { problemDetailsSchema } from "../../schemas/common/problem-details.schema";

export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
