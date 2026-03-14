import { z } from "zod";
import { useMutation } from "@tanstack/react-query";

export const passwordSchema = z
  .string()
  .min(8, "Must be at least 8 characters")
  .regex(/(?=.*[A-Z])/, "Must contain at least one uppercase letter")
  .regex(/(?=.*[a-z])/, "Must contain at least one lowercase letter")
  .regex(/(?=.*\d)/, "Must contain at least one number")
  .regex(
    /(?=.*[!@#$%^&*(),.?":{}|<>])/,
    "Must contain at least one special character",
  );

export const signUpDtoSchema = z.object({
  email: z.email(),
  password: passwordSchema,
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
});

export type SignUpDto = z.infer<typeof signUpDtoSchema>;

export const signUp = async (data: SignUpDto): Promise<void> => {
  const res = await fetch("/api/users", {
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

  return;
};

export const useSignUp = () => {
  return useMutation({
    mutationFn: async (data: SignUpDto) => signUp(data),
  });
};
