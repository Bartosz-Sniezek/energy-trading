import { ErrorCode } from "./error-code.enum";

export const resolveProblemDetailsUrn = (errorCode: ErrorCode): string => {
  return `urn:problem:${errorCode}`;
};
