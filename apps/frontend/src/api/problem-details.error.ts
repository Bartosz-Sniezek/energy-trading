import { ProblemDetails } from "@energy-trading/shared/types";

export const isProblemDetailsError = (
  error: unknown,
): error is ProblemDetailsError => {
  return error instanceof ProblemDetailsError;
};

export class ProblemDetailsError extends Error {
  constructor(readonly details: ProblemDetails) {
    super(details.title);
  }
}
