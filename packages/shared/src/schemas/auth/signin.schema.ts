import z from "zod";

export const signInDtoSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().nonempty("Password cannot be empty"),
});
