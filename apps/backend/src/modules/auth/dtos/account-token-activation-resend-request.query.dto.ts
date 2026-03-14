import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const accountTokenActivationResendRequestedQueryDtoSchema = z.object({
  token: z.string(),
});

export class AccountTokenActivationResendRequestedQueryDto extends createZodDto(
  accountTokenActivationResendRequestedQueryDtoSchema,
) {}
