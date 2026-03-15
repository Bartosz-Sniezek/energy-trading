import {
  ErrorCode,
  resolveProblemDetailsUrn,
} from "@energy-trading/shared/errors";
import { accountNotActivatedProblemDetailsSchema } from "@energy-trading/shared/schemas";
import {
  AccountNotActivatedProblemDetails,
  ProblemDetails,
} from "@energy-trading/shared/types";

export const isProblemDetailsError = (
  error: unknown,
): error is ProblemDetailsError => {
  return error instanceof ProblemDetailsError;
};

export const isAccountNotActiveProblemDetails = (
  error: unknown,
): error is AccountNotActiveProblemDetailsError => {
  if (isProblemDetailsError(error)) {
    const res = accountNotActivatedProblemDetailsSchema.safeParse(
      error.details,
    );

    return res.success;
  }
  return false;
};

export const isActivationResendRequestChallengeExpiredProblemDetails = (
  error: ProblemDetailsError,
) => {
  return (
    error.details.type ===
    ErrorCode.ACCOUNT_ACTIVATION_RESEND_REQUEST_CHALLENGE_EXPIRED
  );
};

export class ProblemDetailsError extends Error {
  constructor(readonly details: ProblemDetails) {
    super(details.title);
  }

  isErrorCode(errorCode: ErrorCode): boolean {
    return this.details.type === resolveProblemDetailsUrn(errorCode);
  }
}

export class AccountNotActiveProblemDetailsError extends ProblemDetailsError {
  constructor(readonly details: AccountNotActivatedProblemDetails) {
    super(details);
  }
}
