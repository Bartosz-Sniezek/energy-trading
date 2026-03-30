import { mock, mockReset } from 'vitest-mock-extended';
import { LoginOutput, LoginUseCase } from './login.use-case';
import { Repository } from 'typeorm';
import { UserEntity } from '@domain/users/entities/user.entity';
import { RefreshTokenEntity } from '../../../domain/auth/entities/refresh-token.entity';
import { TokenService } from '@domain/auth/services/token.service';
import { randomEmail } from 'test/faker/random-email';
import { randomPassword } from 'test/faker/random-password';
import { InvalidCredentialsError } from '@domain/auth/errors/invalid-credentials.error';
import { randomBytes, randomUUID } from 'crypto';
import {
  AccessToken,
  RefreshToken,
  RefreshTokenHash,
  RefreshTokenId,
} from '@domain/auth/types';
import { HashingService } from '@modules/hashing/hashing.service';
import { Hash } from '@domain/users/types';
import { AccountNotActivatedError } from '@domain/auth/errors/account-not-activated.error';
import { createSessionAuthBridgeMock } from 'test/mocks/auth/session-auth-bridge.mock';

describe(LoginUseCase.name, () => {
  const usersRepository = mock<Repository<UserEntity>>();
  const refreshTokenRepository = mock<Repository<RefreshTokenEntity>>();
  const tokenService = mock<TokenService>();
  const refreshToken = randomBytes(64).toString('hex') as RefreshToken;
  const refreshTokenHash = randomBytes(50).toString('hex') as RefreshTokenHash;
  const refreshTokenEntityMock = mock<RefreshTokenEntity>({
    id: <RefreshTokenId>randomUUID(),
    tokenHash: refreshTokenHash,
    family: randomUUID(),
  });
  const hashingService = mock<HashingService>();
  const accessTokenMock = randomBytes(64).toString('hex') as AccessToken;
  const { sessionAuthBridgeMock, resetSessionAuthBridgeMock } =
    createSessionAuthBridgeMock();

  const loginUseCase = new LoginUseCase(
    usersRepository,
    refreshTokenRepository,
    tokenService,
    hashingService,
    sessionAuthBridgeMock,
  );

  beforeEach(() => {
    mockReset(usersRepository);
    mockReset(refreshTokenRepository);
    mockReset(tokenService);
    mockReset(hashingService);
    resetSessionAuthBridgeMock();
    tokenService.createRefreshToken.mockReturnValue({
      tokenEntity: refreshTokenEntityMock,
      token: refreshToken,
      tokenHash: refreshTokenHash,
    });
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

    it('should perform dummy hash to increase prevent side-channel email enumaration', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(
        loginUseCase.execute({
          email: randomEmail(),
          password: randomPassword().getValue(),
        }),
      ).rejects.toThrow(InvalidCredentialsError);
      expect(hashingService.dummyHash).toHaveBeenCalledOnce();
    });

    it('should ignore dummy hashing when user exist', async () => {
      const userMock = mock<UserEntity>();
      usersRepository.findOneBy.mockResolvedValue(userMock);
      hashingService.compare.mockResolvedValue(false);

      await expect(
        loginUseCase.execute({
          email: randomEmail(),
          password: randomPassword().getValue(),
        }),
      ).rejects.toThrow(InvalidCredentialsError);
      expect(hashingService.dummyHash).not.toHaveBeenCalledOnce();
    });

    it('should throw InvalidCredentialsError when user password does not match', async () => {
      const userMock = mock<UserEntity>();
      usersRepository.findOneBy.mockResolvedValue(userMock);
      hashingService.compare.mockResolvedValue(false);

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

    it('should throw AccountNotActivatedError when user account is not active', async () => {
      const userMock = mock<UserEntity>({
        isActive: false,
      });
      usersRepository.findOneBy.mockResolvedValue(userMock);
      hashingService.compare.mockResolvedValue(true);
      const email = randomEmail();
      tokenService.generateResendActivationChallenge.mockResolvedValueOnce({
        challengeKey: randomUUID(),
        email,
        expiresAt: new Date(),
        token: randomBytes(4).toString('hex'),
      });

      await expect(
        loginUseCase.execute({
          email,
          password: randomPassword().getValue(),
        }),
      ).rejects.toThrow(AccountNotActivatedError);
      expect(tokenService.createRefreshToken).not.toHaveBeenCalled();
      expect(tokenService.generateAccessToken).not.toHaveBeenCalled();
      expect(refreshTokenRepository.save).not.toHaveBeenCalled();
    });

    it('should return access and refresh tokens', async () => {
      const userMock = mock<UserEntity>({
        passwordHash: 'some-hash' as Hash,
        isActive: true,
      });
      usersRepository.findOneBy.mockResolvedValue(userMock);
      hashingService.compare.mockResolvedValue(true);

      const password = randomPassword();
      const tokens = await loginUseCase.execute({
        email: randomEmail(),
        password: password.getValue(),
      });

      expect(tokens).toMatchObject<LoginOutput>({
        accessToken: accessTokenMock,
        refreshToken,
      });
      expect(hashingService.compare).toHaveBeenCalledWith(
        password.getValue(),
        userMock.passwordHash,
      );
      expect(tokenService.createRefreshToken).toHaveBeenCalledWith(userMock);
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith(
        userMock,
        refreshTokenEntityMock.family,
      );
      expect(sessionAuthBridgeMock.setSessionInCache).toHaveBeenCalledWith(
        refreshTokenEntityMock.family,
      );
    });
  });
});
