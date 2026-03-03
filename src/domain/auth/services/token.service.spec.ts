import { mock, mockReset } from 'vitest-mock-extended';
import { TokenService } from './token.service';
import { AppConfig } from '@technical/app-config/app-config';
import { JwtService } from '@nestjs/jwt';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { UserEntity } from '@modules/users/entities/user.entity';
import { randomUserId } from 'test/faker/random-user-id';
import { vi } from 'vitest';
import { randomUUID } from 'crypto';
import { randomEmail } from 'test/faker/random-email';
import { AccessToken, AccessTokenPayload, RefreshToken } from '../types';
import { AppCacheService } from '@technical/cache/app-cache.service';

describe(TokenService.name, () => {
  const appConfig = mock<AppConfig>({
    values: {
      JWT_ACCESS_TOKEN_SECRET: 'abc',
      JWT_ACCESS_TOKEN_EXPIRATION_SEC: 60,
      JWT_REFRESH_TOKEN_EXPIRATION_SEC: 120,
    },
  });
  const datetimeService = new DatetimeService();
  const jwtService = new JwtService();
  const cacheMock = mock<AppCacheService>();
  const userMock = mock<UserEntity>({
    id: randomUserId(),
    email: randomEmail().getValue(),
  });
  const newDateMock = new Date();
  vi.spyOn(datetimeService, 'new').mockReturnValue(newDateMock);
  const service = new TokenService(
    appConfig,
    jwtService,
    datetimeService,
    cacheMock,
  );

  beforeEach(() => mockReset(cacheMock));

  describe(service.createRefreshToken.name, () => {
    it('should create a refresh token with a new family', () => {
      const token = service.createRefreshToken(userMock);

      expect(token.id).toBeString();
      expect(token.userId).toBe(userMock.id);
      expect(token.family).toBeString();
      expect(token.revokedAt).toBeNull();
      expect(token.replacedBy).toBeNull();
      expect(token.createdAt.getTime()).toBe(newDateMock.getTime());
      expect(token.expiresAt.getTime()).toBe(
        newDateMock.getTime() + 120 * 1000,
      );
    });

    it('should create a refresh token reusing a family', () => {
      const family = randomUUID();
      const token = service.createRefreshToken(userMock, family);

      expect(token.id).toBeString();
      expect(token.userId).toBe(userMock.id);
      expect(token.family).toBe(family);
      expect(token.revokedAt).toBeNull();
      expect(token.replacedBy).toBeNull();
      expect(token.createdAt.getTime()).toBe(newDateMock.getTime());
      expect(token.expiresAt.getTime()).toBe(
        newDateMock.getTime() + 120 * 1000,
      );
    });

    it('should create a different refresh tokens each time', () => {
      const token = service.createRefreshToken(userMock);
      const secondToken = service.createRefreshToken(userMock);

      expect(token.id).not.toBe(secondToken.id);
      expect(token.userId).toBe(userMock.id);
      expect(token.family).not.toBe(secondToken.id);
    });
  });

  describe(service.generateAccessToken.name, () => {
    it('should create an access token', async () => {
      const sessionId = randomUUID();
      const token = await service.generateAccessToken(userMock, sessionId);

      expect(token).toBeString();

      const payload = jwtService.decode(token, {
        json: true,
      });

      const iat = Math.floor(newDateMock.getTime() / 1000);
      expect(payload).toMatchObject<AccessTokenPayload>({
        sub: userMock.id,
        email: userMock.email,
        iat,
        exp: iat + appConfig.values.JWT_ACCESS_TOKEN_EXPIRATION_SEC,
        jti: expect.toBeString(),
        sid: sessionId,
      });
    });

    it('should create a different access tokens each time', async () => {
      const sessionId = randomUUID();
      const token = await service.generateAccessToken(userMock, sessionId);
      const secondToken = await service.generateAccessToken(
        userMock,
        sessionId,
      );

      expect(token).not.toBe(secondToken);
    });
  });

  describe(service.isSessionBlacklisted.name, () => {
    it('should return false is user session is not blacklisted', async () => {
      const userId = randomUserId();
      const sessionId = randomUUID();
      cacheMock.get.mockResolvedValue(undefined);

      await expect(
        service.isSessionBlacklisted(userId, sessionId),
      ).resolves.toBeFalse();
      expect(cacheMock.get).toHaveBeenCalledWith(
        `blacklist:session:${userId}:${sessionId}`,
      );
    });

    it('should return true is user session is blacklisted', async () => {
      const userId = randomUserId();
      const sessionId = randomUUID();
      cacheMock.get.mockResolvedValue('1');

      await expect(
        service.isSessionBlacklisted(userId, sessionId),
      ).resolves.toBeTrue();
      expect(cacheMock.get).toHaveBeenCalledWith(
        `blacklist:session:${userId}:${sessionId}`,
      );
    });
  });

  describe(service.blacklistSession.name, () => {
    it('should set user session in cache', async () => {
      const userId = randomUserId();
      const sessionId = randomUUID();
      await expect(service.blacklistSession(userId, sessionId)).toResolve();
      expect(cacheMock.set).toHaveBeenCalledWith(
        `blacklist:session:${userId}:${sessionId}`,
        '1',
        appConfig.values.JWT_REFRESH_TOKEN_EXPIRATION_SEC * 1000,
      );
    });
  });

  describe(service.isAccessTokenBlacklisted.name, () => {
    it('should return false if user access token is not blacklisted', async () => {
      const userId = randomUserId();
      const accessToken = <AccessToken>randomUUID();
      cacheMock.get.mockResolvedValue(undefined);

      await expect(
        service.isAccessTokenBlacklisted(userId, accessToken),
      ).resolves.toBeFalse();
      expect(cacheMock.get).toHaveBeenCalledWith(
        `blacklist:access_token:${userId}:${accessToken}`,
      );
    });

    it('should return true if user access token is blacklisted', async () => {
      const userId = randomUserId();
      const accessToken = <AccessToken>randomUUID();
      cacheMock.get.mockResolvedValue('1');

      await expect(
        service.isAccessTokenBlacklisted(userId, accessToken),
      ).resolves.toBeTrue();
      expect(cacheMock.get).toHaveBeenCalledWith(
        `blacklist:access_token:${userId}:${accessToken}`,
      );
    });
  });

  describe(service.blacklistAccessToken.name, () => {
    it('should set user access token in cache', async () => {
      const userId = randomUserId();
      const accessToken = <AccessToken>randomUUID();
      await expect(
        service.blacklistAccessToken(userId, accessToken),
      ).toResolve();
      expect(cacheMock.set).toHaveBeenCalledWith(
        `blacklist:access_token:${userId}:${accessToken}`,
        '1',
        appConfig.values.JWT_ACCESS_TOKEN_EXPIRATION_SEC * 1000,
      );
    });
  });

  describe(service.isRefreshTokenBlacklisted.name, () => {
    it('should return false if user refresh token is not blacklisted', async () => {
      const userId = randomUserId();
      const refreshToken = <RefreshToken>randomUUID();
      cacheMock.get.mockResolvedValue(undefined);

      await expect(
        service.isRefreshTokenBlacklisted(userId, refreshToken),
      ).resolves.toBeFalse();
      expect(cacheMock.get).toHaveBeenCalledWith(
        `blacklist:refresh_token:${userId}:${refreshToken}`,
      );
    });

    it('should return true if user refresh token is blacklisted', async () => {
      const userId = randomUserId();
      const refreshToken = <RefreshToken>randomUUID();
      cacheMock.get.mockResolvedValue('1');

      await expect(
        service.isRefreshTokenBlacklisted(userId, refreshToken),
      ).resolves.toBeTrue();
      expect(cacheMock.get).toHaveBeenCalledWith(
        `blacklist:refresh_token:${userId}:${refreshToken}`,
      );
    });
  });

  describe(service.blacklistRefreshToken.name, () => {
    it('should set user access token in cache', async () => {
      const userId = randomUserId();
      const refreshToken = <RefreshToken>randomUUID();
      await expect(
        service.blacklistRefreshToken(userId, refreshToken),
      ).toResolve();
      expect(cacheMock.set).toHaveBeenCalledWith(
        `blacklist:refresh_token:${userId}:${refreshToken}`,
        '1',
        appConfig.values.JWT_REFRESH_TOKEN_EXPIRATION_SEC * 1000,
      );
    });
  });
});
