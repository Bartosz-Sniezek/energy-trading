import { AuthApiClient } from "@/api/auth-api-client";
import { ProblemDetailsError } from "@/api/problem-details.error";
import { SignInDto } from "@energy-trading/shared/types";
import { useMutation } from "@tanstack/react-query";

export const useSignIn = () => {
  return useMutation<void, ProblemDetailsError, SignInDto>({
    mutationFn: async (data: SignInDto) => AuthApiClient.create().login(data),
  });
};
