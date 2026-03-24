import { mock, mockReset } from 'vitest-mock-extended';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '@technical/app-config/app-config';
import { AccessTokenPayload, AuthenticatedUser } from '@domain/auth/types';
import { randomUserId } from 'test/faker/random-user-id';
import { randomEmail } from 'test/faker/random-email';
import { randomUUID } from 'crypto';
import { TokenService } from '@domain/auth/services/token.service';
import { UnauthorizedError } from '@domain/auth/errors/unauthorized.error';
import { JwtAuthService } from './jwt-auth.service';
import { randomHash } from 'test/faker/random-hash';

describe(JwtAuthService.name, () => {
  const jwtServiceMock = mock<JwtService>();
  const appConfigMock = mock<AppConfig>({
    values: {
      JWT_ACCESS_TOKEN_SECRET: 'secret',
    },
  });
  const tokenServiceMock = mock<TokenService>();

  beforeEach(() => {
    mockReset(jwtServiceMock);
    mockReset(appConfigMock);
    mockReset(tokenServiceMock);
  });

  const jwtAuthService = new JwtAuthService(
    jwtServiceMock,
    appConfigMock,
    tokenServiceMock,
  );
  const token = randomHash();

  describe(jwtAuthService.validate.name, () => {
    it('should throw UnauthorizedError if token verificaiton failed', async () => {
      jwtServiceMock.verifyAsync.mockRejectedValue(new Error('verify error'));

      await expect(jwtAuthService.validate(token)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('should throw UnauthorizedError if user session is blacklisted', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue(mock<AccessTokenPayload>());
      tokenServiceMock.isSessionBlacklisted.mockResolvedValue(true);
      tokenServiceMock.isAccessTokenBlacklisted.mockResolvedValue(false);

      await expect(jwtAuthService.validate(token)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('should throw UnauthorizedError if user access_token is blacklisted', async () => {
      jwtServiceMock.verifyAsync.mockRejectedValue(mock<AccessTokenPayload>());
      tokenServiceMock.isSessionBlacklisted.mockResolvedValue(false);
      tokenServiceMock.isAccessTokenBlacklisted.mockResolvedValue(true);

      await expect(jwtAuthService.validate(token)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('should return AuthenticatedUser if token verificaiton passed', async () => {
      tokenServiceMock.isSessionBlacklisted.mockResolvedValue(false);
      tokenServiceMock.isAccessTokenBlacklisted.mockResolvedValue(false);

      const sessionId = randomUUID();
      const userId = randomUserId();
      const email = randomEmail().getValue();
      const payload = mock<AccessTokenPayload>({
        sub: userId,
        email,
        sid: sessionId,
      });
      jwtServiceMock.verifyAsync.mockResolvedValue(payload);

      await expect(
        jwtAuthService.validate(token),
      ).resolves.toMatchObject<AuthenticatedUser>({
        userId,
        email,
        sessionId,
      });
    });
  });
});
