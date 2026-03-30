import { mock, mockReset } from 'vitest-mock-extended';
import { GetAuthenticatedUserProfileUseCase } from './get-authenticated-user-profile.use-case';
import { Repository } from 'typeorm';
import { UserEntity } from '@domain/users/entities/user.entity';
import { AuthenticatedUser } from '@domain/auth/types';
import { randomUserId } from 'test/faker/random-user-id';
import { randomEmail } from 'test/faker/random-email';
import { randomUUID } from 'crypto';
import { UserDoesNotExistError } from '@domain/users/errors/user-does-not-exist.error';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { MeDto } from '../controllers/dtos/me.dto';

describe(GetAuthenticatedUserProfileUseCase.name, () => {
  const repositoryMock = mock<Repository<UserEntity>>();
  const useCase = new GetAuthenticatedUserProfileUseCase(repositoryMock);

  beforeEach(() => {
    mockReset(repositoryMock);
  });

  const user: AuthenticatedUser = {
    userId: randomUserId(),
    email: randomEmail().getValue(),
    sessionId: randomUUID(),
  };

  describe(GetAuthenticatedUserProfileUseCase.prototype.execute.name, () => {
    it('should thorw UserDoesNotExistError if user does not exist', async () => {
      repositoryMock.findOneBy.mockResolvedValue(null);

      await expect(useCase.execute(user)).rejects.toThrow(
        UserDoesNotExistError,
      );
    });

    it('should thorw UserDoesNotExistError if user does not exist', async () => {
      const userMock = mock<UserEntity>({
        id: user.userId,
        email: user.email,
        firstName: randomFirstName(),
        lastName: randomLastName(),
      });
      repositoryMock.findOneBy.mockResolvedValue(userMock);

      const dto = await useCase.execute(user);

      expect(dto).toMatchObject<MeDto>({
        id: userMock.id,
        email: userMock.email,
        firstName: userMock.firstName,
        lastName: userMock.lastName,
      });
    });
  });
});
