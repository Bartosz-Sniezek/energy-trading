import { UserEntity } from '@modules/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeDto } from '../dtos/me.dto';
import { AuthenticatedUser } from '@domain/auth/types';
import { UserDoesNotExistError } from '@domain/users/errors/user-does-not-exist.error';

export class GetAuthenticatedUserProfileUseCase {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async execute(user: AuthenticatedUser): Promise<MeDto> {
    const userFound = await this.usersRepository.findOneBy({
      id: user.userId,
    });

    if (userFound == null) throw new UserDoesNotExistError();

    return MeDto.fromEntity(userFound);
  }
}
