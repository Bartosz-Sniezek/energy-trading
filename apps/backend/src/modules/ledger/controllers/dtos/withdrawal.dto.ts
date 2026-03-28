import { withdrawalSchema } from '@energy-trading/shared/schemas';
import { createZodDto } from 'nestjs-zod';

export class WithdrawalDto extends createZodDto(withdrawalSchema) {}
