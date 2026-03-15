import { AuthApiClient } from "@/api/auth-api-client";
import { ProblemDetailsError } from "@/api/problem-details.error";
import { useMutation } from "@tanstack/react-query";

export const useActivateAccount = () => {
  return useMutation<void, ProblemDetailsError, string>({
    mutationFn: (token: string) =>
      AuthApiClient.create().activateAccount(token),
  });
};
