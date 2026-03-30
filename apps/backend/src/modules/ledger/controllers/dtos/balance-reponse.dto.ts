import { balanceResponseDtoSchema } from '@energy-trading/shared/schemas';
import { createZodDto } from 'nestjs-zod';

export class BalanceResponseDto extends createZodDto(
  balanceResponseDtoSchema,
) {}
