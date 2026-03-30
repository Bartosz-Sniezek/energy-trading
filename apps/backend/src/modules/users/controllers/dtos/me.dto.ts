import { meDtoSchema } from '@energy-trading/shared/schemas';
import { UserEntity } from '@domain/users/entities/user.entity';
import { createZodDto } from 'nestjs-zod';

export class MeDto extends createZodDto(meDtoSchema) {
  static fromEntity(user: UserEntity): MeDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
