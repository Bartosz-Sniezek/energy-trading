import { mock, mockReset } from 'vitest-mock-extended';
import { LoginOutput, LoginUseCase } from './login.use-case';
import { Repository } from 'typeorm';
import { UserEntity } from '@modules/users/entities/user.entity';
import { RefreshTokenEntity } from '../../../domain/auth/entities/refresh-token.entity';
import { TokenService } from '@domain/auth/services/token.service';
import { randomEmail } from 'test/faker/random-email';
import { randomPassword } from 'test/faker/random-password';
import { InvalidCredentialsError } from '@domain/auth/errors/invalid-credentials.error';
import { randomBytes } from 'crypto';
import { AccessToken, RefreshToken } from '@domain/auth/types';

describe(LoginUseCase.name, () => {
  const usersRepository = mock<Repository<UserEntity>>();
  const refreshTokenRepository = mock<Repository<RefreshTokenEntity>>();
  const tokenService = mock<TokenService>();
  const refreshTokenValueMock = randomBytes(50).toString('hex') as RefreshToken;
  const refreshTokenEntityMock = mock<RefreshTokenEntity>({
    token: refreshTokenValueMock,
  });
  const accessTokenMock = randomBytes(64).toString('hex') as AccessToken;

  const loginUseCase = new LoginUseCase(
    usersRepository,
    refreshTokenRepository,
    tokenService,
  );

  beforeEach(() => {
    mockReset(usersRepository);
    mockReset(refreshTokenRepository);
    mockReset(tokenService);
    tokenService.createRefreshToken.mockReturnValue(refreshTokenEntityMock);
    tokenService.generateAccessToken.mockResolvedValue(accessTokenMock);
  });

  describe(loginUseCase.execute.name, () => {
    it('should throw InvalidCredentialsError when user is not found', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(
        loginUseCase.execute({
          email: randomEmail(),
          password: randomPassword().getValue(),
        }),
      ).rejects.toThrow(InvalidCredentialsError);
      expect(tokenService.createRefreshToken).not.toHaveBeenCalled();
      expect(tokenService.generateAccessToken).not.toHaveBeenCalled();
      expect(refreshTokenRepository.save).not.toHaveBeenCalled();
    });

    it('should return access and refresh tokens', async () => {
      const userMock = mock<UserEntity>();
      usersRepository.findOneBy.mockResolvedValue(userMock);

      const tokens = await loginUseCase.execute({
        email: randomEmail(),
        password: randomPassword().getValue(),
      });

      expect(tokens).toMatchObject<LoginOutput>({
        accessToken: accessTokenMock,
        refreshToken: refreshTokenValueMock,
      });
      expect(tokenService.createRefreshToken).toHaveBeenCalledWith(userMock);
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith(userMock);
    });
  });
});
