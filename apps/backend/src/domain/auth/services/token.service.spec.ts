import { mock, mockReset } from 'vitest-mock-extended';
import {
  AccountActivationChallenge,
  SerializedAccountActivationChallenge,
  TokenService,
} from './token.service';
import { AppConfig } from '@technical/app-config/app-config';
import { JwtService } from '@nestjs/jwt';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { UserEntity } from '@domain/users/entities/user.entity';
import { randomUserId } from 'test/faker/random-user-id';
import { vi } from 'vitest';
import { randomBytes, randomUUID } from 'crypto';
import { randomEmail } from 'test/faker/random-email';
import { AccessToken, AccessTokenPayload, RefreshToken } from '../types';
import { AppCacheService } from '@technical/cache/app-cache.service';
import { Email } from '@domain/users/value-objects/email';
import { addSeconds } from 'date-fns';

describe(TokenService.name, () => {
  const appConfig = mock<AppConfig>({
    values: {
      JWT_ACCESS_TOKEN_SECRET: 'abc',
      JWT_ACCESS_TOKEN_EXPIRATION_SEC: 60,
      JWT_REFRESH_TOKEN_EXPIRATION_SEC: 120,
      ACCOUNT_ACTIVATION_RESEND_TOKEN_TTL_SECONDS: 60,
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

  beforeEach(() => {
    mockReset(cacheMock);
  });

  describe(service.createRefreshToken.name, () => {
    it('should create a refresh token with a new family', () => {
      const {
        tokenEntity: token,
        token: refreshToken,
        tokenHash,
      } = service.createRefreshToken(userMock);

      expect(refreshToken).not.toBe(tokenHash);
      expect(token.id).toBeString();
      expect(token.userId).toBe(userMock.id);
      expect(token.tokenHash).toBe(tokenHash);
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
      const {
        tokenEntity: token,
        token: refreshToken,
        tokenHash,
      } = service.createRefreshToken(userMock, family);

      expect(refreshToken).not.toBe(tokenHash);
      expect(token.id).toBeString();
      expect(token.userId).toBe(userMock.id);
      expect(token.tokenHash).toBe(tokenHash);
      expect(token.family).toBe(family);
      expect(token.revokedAt).toBeNull();
      expect(token.replacedBy).toBeNull();
      expect(token.createdAt.getTime()).toBe(newDateMock.getTime());
      expect(token.expiresAt.getTime()).toBe(
        newDateMock.getTime() + 120 * 1000,
      );
    });

    it('should create a different refresh tokens each time', () => {
      const {
        tokenEntity: token,
        token: refreshToken,
        tokenHash,
      } = service.createRefreshToken(userMock);
      const {
        tokenEntity: secondToken,
        token: refreshToken2,
        tokenHash: tokenHash2,
      } = service.createRefreshToken(userMock);

      expect(token.id).not.toBe(secondToken.id);
      expect(token.userId).toBe(userMock.id);
      expect(token.family).not.toBe(secondToken.id);
      expect(refreshToken).not.toBe(refreshToken2);
      expect(tokenHash).not.toBe(tokenHash2);
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
      const refreshToken = <RefreshToken>randomUUID();
      cacheMock.get.mockResolvedValue(undefined);

      await expect(
        service.isRefreshTokenBlacklisted(refreshToken),
      ).resolves.toBeFalse();
      expect(cacheMock.get).toHaveBeenCalledWith(
        `blacklist:refresh_token:${refreshToken}`,
      );
    });

    it('should return true if user refresh token is blacklisted', async () => {
      const refreshToken = <RefreshToken>randomUUID();
      cacheMock.get.mockResolvedValue('1');

      await expect(
        service.isRefreshTokenBlacklisted(refreshToken),
      ).resolves.toBeTrue();
      expect(cacheMock.get).toHaveBeenCalledWith(
        `blacklist:refresh_token:${refreshToken}`,
      );
    });
  });

  describe(service.blacklistRefreshToken.name, () => {
    it('should set refresh token in cache', async () => {
      const refreshToken = <RefreshToken>randomUUID();
      await expect(service.blacklistRefreshToken(refreshToken)).toResolve();
      expect(cacheMock.set).toHaveBeenCalledWith(
        `blacklist:refresh_token:${refreshToken}`,
        '1',
        appConfig.values.JWT_REFRESH_TOKEN_EXPIRATION_SEC * 1000,
      );
    });
  });

  describe('account activation challenge', () => {
    let email: Email;

    beforeEach(() => {
      email = randomEmail();
    });

    describe(service.getAccountActivationChallengeByEmail.name, () => {
      it('should reach cache with valid key', async () => {
        await expect(
          service.getAccountActivationChallengeByEmail(email),
        ).resolves.toBeNull();
        expect(cacheMock.get).toHaveBeenCalledWith(
          `key:account_activation_token_challenge:by:email:${email.getValue()}`,
        );
      });

      it('should resolve account activation challenge key by email', async () => {
        cacheMock.get.mockResolvedValueOnce(randomUUID());

        await expect(
          service.getAccountActivationChallengeByEmail(email),
        ).resolves.toBeNull();
        expect(cacheMock.get).toHaveBeenCalledWith(
          `key:account_activation_token_challenge:by:email:${email.getValue()}`,
        );
      });

      it('should return data from cache', async () => {
        const data: SerializedAccountActivationChallenge = {
          email: email.getValue(),
          challengeKey: randomUUID(),
          expiresAt: new Date().toISOString(),
          token: randomBytes(4).toString('hex'),
        };
        const queue = [data.challengeKey, data];

        cacheMock.get.mockImplementation((_key: string) =>
          Promise.resolve(queue.shift()),
        );

        const activationChallenge =
          await service.getAccountActivationChallengeByEmail(email);
        expect(activationChallenge).toMatchObject<AccountActivationChallenge>({
          email: Email.create(data.email),
          challengeKey: data.challengeKey,
          token: data.token,
          expiresAt: new Date(data.expiresAt),
        });
      });
    });

    describe(service.generateResendActivationChallenge.name, () => {
      it('should create and set new token', async () => {
        cacheMock.get.mockResolvedValue(null);
        const data = await service.generateResendActivationChallenge(email);

        expect(data).toMatchObject<AccountActivationChallenge>({
          email,
          challengeKey: data.challengeKey,
          token: expect.toBeString(),
          expiresAt: addSeconds(newDateMock, 1000 * 60),
        });

        expect(cacheMock.set).toHaveBeenCalledWith(
          `key:account_activation_token_challenge:by:email:${email.getValue()}`,
          data.challengeKey,
          1000 * 60,
        );
        expect(cacheMock.set).toHaveBeenCalledWith(
          `key:account_activation_token_challenge:by:token:${data.token}`,
          data.challengeKey,
          1000 * 60,
        );
        expect(cacheMock.set).toHaveBeenCalledWith(
          data.challengeKey,
          <SerializedAccountActivationChallenge>{
            email: email.getValue(),
            challengeKey: data.challengeKey,
            token: expect.toBeString(),
            expiresAt: expect.toBeDateString(),
          },
          1000 * 60,
        );
      });
    });
  });
});
