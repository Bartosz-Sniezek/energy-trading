import { safeParse } from "zod";
import { problemDetailsSchema } from "../schemas/common/problem-details.schema";
import { ProblemDetails } from "../types/common/problem-details.types";

export const isProblemDetails = (error: unknown): error is ProblemDetails => {
  const sa = safeParse(problemDetailsSchema, error);

  return sa.success;
};
