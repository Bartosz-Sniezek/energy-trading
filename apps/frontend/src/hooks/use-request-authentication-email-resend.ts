import { AuthApiClient } from "@/api/auth-api-client";
import { ProblemDetailsError } from "@/api/problem-details.error";
import { useMutation } from "@tanstack/react-query";

export const useRequestAuthenticationEmailResend = () => {
  return useMutation<void, ProblemDetailsError, string>({
    mutationFn: async (token) =>
      AuthApiClient.create().requestActivationTokenResend(token),
  });
};
