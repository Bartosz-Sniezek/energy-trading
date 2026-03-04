import { RefreshTokenEntity } from '@domain/auth/entities/refresh-token.entity';
import { InvalidRefreshToken } from '@domain/auth/errors/invalid-refresh-token.error';
import { TokenService } from '@domain/auth/services/token.service';
import { RotateTokenUseCase } from '@modules/auth/use-cases/rotate-token.use-case';
import { UserEntity } from '@modules/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { subDays } from 'date-fns';
import { randomRefreshToken } from 'test/faker/random-refresh-token';
import { RefreshTokenFixture } from 'test/fixtures/refresh-token.fixture';
import { UsersFixture } from 'test/fixtures/users-fixture';
import { AppTestingFixture } from 'test/helpers/app-testing-fixture';
import { Repository } from 'typeorm';

describe(RotateTokenUseCase.name, () => {
  let testingFixture: AppTestingFixture;
  let rotateTokenUseCase: RotateTokenUseCase;
  let usersFixutre: UsersFixture;
  let refreshTokenFixture: RefreshTokenFixture;
  let refreshTokenRepository: Repository<RefreshTokenEntity>;
  let tokenService: TokenService;

  beforeAll(async () => {
    testingFixture = await AppTestingFixture.create({
      mockKafka: true,
    });
    usersFixutre = testingFixture.getUsersFixture();
    refreshTokenFixture = testingFixture.getRefreshTokenFixture();
    refreshTokenRepository = testingFixture
      .getApp()
      .get<
        Repository<RefreshTokenEntity>
      >(getRepositoryToken(RefreshTokenEntity));
    rotateTokenUseCase = testingFixture.getApp().get(RotateTokenUseCase);
    tokenService = testingFixture.getApp().get(TokenService);
  });

  beforeEach(async () => {
    await testingFixture.truncateDatabase();
    await testingFixture.clearCache();
  });

  describe(RotateTokenUseCase.prototype.execute.name, () => {
    it('should rotate token', async () => {
      const { user } = await usersFixutre.createActivatedUser();
      const refreshTokenEntity =
        await refreshTokenFixture.createRefreshTokenFor(user);

      const { accessToken, refreshToken } = await rotateTokenUseCase.execute(
        refreshTokenEntity.token,
      );

      expect(accessToken).toBeString();
      expect(refreshToken).toBeString();

      const entity = await refreshTokenFixture.getEntityByToken(refreshToken);
      expect(entity.id).toBeString();
      expect(entity.userId).toBe(user.id);
      expect(entity.family).toBeString();
      expect(entity.token).toBeString();
      expect(entity.replacedBy).toBeNull();
      expect(entity.revokedAt).toBeNull();
      expect(entity.createdAt).toBeDate();
    });

    it('should chain-rotate token', async () => {
      const { user } = await usersFixutre.createActivatedUser();
      const refreshTokenEntity =
        await refreshTokenFixture.createRefreshTokenFor(user);

      const { accessToken, refreshToken } = await rotateTokenUseCase.execute(
        refreshTokenEntity.token,
      );

      expect(accessToken).toBeString();
      expect(refreshToken).toBeString();

      const tokens2 = await rotateTokenUseCase.execute(refreshToken);

      expect(tokens2.accessToken).toBeString();
      expect(tokens2.refreshToken).toBeString();

      const token1Entity =
        await refreshTokenFixture.getEntityByToken(refreshToken);
      const token2Entity = await refreshTokenFixture.getEntityByToken(
        tokens2.refreshToken,
      );

      expect(token1Entity.replacedBy).toBe(token2Entity.id);
      expect(token1Entity.revokedAt).toBeDate();
      expect(token1Entity.userId).toBe(user.id);
      expect(token1Entity.family).toBeString();
      expect(token1Entity.token).toBe(refreshToken);
      expect(token1Entity.createdAt).toBeDate();

      expect(token2Entity.replacedBy).toBeNull();
      expect(token2Entity.revokedAt).toBeNull();
      expect(token2Entity.family).toBe(token1Entity.family);
      expect(token2Entity.userId).toBe(token1Entity.userId);

      await expect(
        tokenService.isRefreshTokenBlacklisted(token1Entity.token),
      ).resolves.toBeTrue();
      await expect(
        tokenService.isRefreshTokenBlacklisted(token2Entity.token),
      ).resolves.toBeFalse();
    });

    it('should throw InvalidRefreshToken for non-existing refresh token', async () => {
      const randomToken = randomRefreshToken();

      await expect(rotateTokenUseCase.execute(randomToken)).rejects.toThrow(
        InvalidRefreshToken,
      );
    });

    it('should throw InvalidRefreshToken for non active user', async () => {
      const { user } = await usersFixutre.createUser();
      const refreshToken =
        await refreshTokenFixture.createRefreshTokenFor(user);

      await expect(
        rotateTokenUseCase.execute(refreshToken.token),
      ).rejects.toThrow(InvalidRefreshToken);
    });

    it('should throw InvalidRefreshToken for non existing user', async () => {
      const { user } = await usersFixutre.createUser();
      const refreshToken =
        await refreshTokenFixture.createRefreshTokenFor(user);
      const usersRepository = testingFixture
        .getApp()
        .get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
      await usersRepository.delete({
        id: user.id,
      });

      await expect(usersRepository.findOneByOrFail({ id: user.id })).toReject();
      await expect(
        rotateTokenUseCase.execute(refreshToken.token),
      ).rejects.toThrow(InvalidRefreshToken);
    });

    it('should throw InvalidRefreshToken for revoked token', async () => {
      const { user } = await usersFixutre.createActivatedUser();
      const refreshToken =
        await refreshTokenFixture.createRefreshTokenFor(user);

      // rotate once
      await rotateTokenUseCase.execute(refreshToken.token);

      // fail on second rotate attempt
      await expect(
        rotateTokenUseCase.execute(refreshToken.token),
      ).rejects.toThrow(InvalidRefreshToken);
    });

    it('should invalidate all tokens in a family', async () => {
      const { user } = await usersFixutre.createActivatedUser();
      const refreshToken1 =
        await refreshTokenFixture.createRefreshTokenFor(user);

      // rotate once
      const tokens2 = await rotateTokenUseCase.execute(refreshToken1.token);

      // rotate second time
      const tokens3 = await rotateTokenUseCase.execute(tokens2.refreshToken);

      // attempt to rotate with tokens2 refresh token (already rotated, theft detection)
      await expect(
        rotateTokenUseCase.execute(tokens2.refreshToken),
      ).rejects.toThrow(InvalidRefreshToken);

      // tokens3 refresh token should be invalid
      await expect(
        rotateTokenUseCase.execute(tokens3.refreshToken),
      ).rejects.toThrow(InvalidRefreshToken);

      const token1Entity = await refreshTokenFixture.getEntityByToken(
        refreshToken1.token,
      );
      const token2Entity = await refreshTokenFixture.getEntityByToken(
        tokens2.refreshToken,
      );
      const token3Entity = await refreshTokenFixture.getEntityByToken(
        tokens3.refreshToken,
      );

      expect(token1Entity.replacedBy).toBe(token2Entity.id);
      expect(token1Entity.revokedAt).toBeDate();
      expect(token1Entity.userId).toBe(user.id);
      expect(token1Entity.family).toBeString();
      expect(token1Entity.token).toBe(refreshToken1.token);
      expect(token1Entity.createdAt).toBeDate();

      expect(token2Entity.replacedBy).toBe(token3Entity.id);
      expect(token2Entity.revokedAt).toBeDate();
      expect(token2Entity.family).toBe(token1Entity.family);
      expect(token2Entity.userId).toBe(token1Entity.userId);

      expect(token3Entity.replacedBy).toBeNull();
      expect(token3Entity.revokedAt).toBeDate();
      expect(token3Entity.revokedAt?.getTime()).not.toBe(
        token1Entity.revokedAt?.getTime(),
      );
      expect(token3Entity.family).toBe(token2Entity.family);
      expect(token3Entity.userId).toBe(token2Entity.userId);

      await expect(
        tokenService.isSessionBlacklisted(
          token1Entity.userId,
          token1Entity.family,
        ),
      ).resolves.toBeTrue();
      await expect(
        tokenService.isRefreshTokenBlacklisted(token1Entity.token),
      ).resolves.toBeTrue();
      await expect(
        tokenService.isRefreshTokenBlacklisted(token2Entity.token),
      ).resolves.toBeTrue();
      await expect(
        tokenService.isRefreshTokenBlacklisted(token3Entity.token),
      ).resolves.toBeTrue();
    });

    it('should throw InvalidRefreshToken for expired token', async () => {
      const { user } = await usersFixutre.createActivatedUser();
      const refreshToken =
        await refreshTokenFixture.createRefreshTokenFor(user);
      const now = new Date();
      const expiredTokenDate = subDays(now, 8);
      await refreshTokenRepository.update(
        {
          token: refreshToken.token,
        },
        {
          expiresAt: expiredTokenDate,
        },
      );

      await expect(
        rotateTokenUseCase.execute(refreshToken.token),
      ).rejects.toThrow(InvalidRefreshToken);
      await expect(
        tokenService.isRefreshTokenBlacklisted(refreshToken.token),
      ).resolves.toBeTrue();
    });
  });
});
