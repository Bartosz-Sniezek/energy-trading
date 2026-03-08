import { passwordSchema } from '@common/schema/password.schema';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const registerUserDtoSchema = z.object({
  email: z.email(),
  password: passwordSchema,
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
});

export class RegisterUserDto extends createZodDto(registerUserDtoSchema) {}
