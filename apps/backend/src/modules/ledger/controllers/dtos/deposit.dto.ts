import { depositSchema } from '@energy-trading/shared/schemas';
import { createZodDto } from 'nestjs-zod';

export class DepositDto extends createZodDto(depositSchema) {}
