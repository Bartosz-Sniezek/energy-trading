import { SignInDto } from "@energy-trading/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const signIn = async (data: SignInDto): Promise<void> => {
  console.log(data);
  const res = await fetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const data = await res.json();

    throw new Error(data.message);
  }

  return res.json();
};

export const useSignIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SignInDto) => signIn(data),
  });
};
