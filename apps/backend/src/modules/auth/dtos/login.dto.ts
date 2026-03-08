import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const loginDtoSchema = z.object({
  email: z.string().nonempty(),
  password: z.string().nonempty(),
});

export class LoginDto extends createZodDto(loginDtoSchema) {}
