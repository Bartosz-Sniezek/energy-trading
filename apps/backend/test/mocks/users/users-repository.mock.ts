import { UserEntity } from '@domain/users/entities/user.entity';
import { Repository } from 'typeorm';
import { mock, MockProxy, mockReset } from 'vitest-mock-extended';

type UsersRepositoryMock = MockProxy<Repository<UserEntity>>;

export const createUsersRepositoryMock = () => {
  const usersRepositoryMock: UsersRepositoryMock =
    mock<Repository<UserEntity>>();

  return {
    usersRepositoryMock,
    resetUsersRepositoryMock: () => {
      mockReset(usersRepositoryMock);
    },
  };
};
