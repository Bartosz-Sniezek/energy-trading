import { mock, mockReset } from 'vitest-mock-extended';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '@technical/app-config/app-config';
import { Request } from 'express';
import { ExecutionContext, HttpArgumentsHost } from '@nestjs/common/interfaces';
import { AccessTokenPayload, AuthenticatedUser } from '@domain/auth/types';
import { randomUserId } from 'test/faker/random-user-id';
import { randomEmail } from 'test/faker/random-email';
import { randomUUID } from 'crypto';
import { TokenService } from '@domain/auth/services/token.service';
import { UnauthorizedError } from '@domain/auth/errors/unauthorized.error';

describe(JwtAuthGuard.name, () => {
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

  const guard = new JwtAuthGuard(
    jwtServiceMock,
    appConfigMock,
    tokenServiceMock,
  );

  describe(guard.canActivate.name, () => {
    it('should throw UnauthorizedError if there is no access_token in signed cookies', async () => {
      const requestMock = { signedCookies: {} } as Request;
      const httpArgumentsHostMock = mock<HttpArgumentsHost>();
      const contextMock = mock<ExecutionContext>();

      httpArgumentsHostMock.getRequest.mockReturnValue(requestMock);
      contextMock.switchToHttp.mockReturnValue(httpArgumentsHostMock);

      await expect(guard.canActivate(contextMock)).rejects.toThrow(
        UnauthorizedError,
      );
      expect(requestMock.user).toBeUndefined();
    });

    it('should throw UnauthorizedError if token verificaiton failed', async () => {
      const requestMock = {
        signedCookies: {
          access_token: 'random-token',
        } as { [key: string]: any },
      } as Request;
      const httpArgumentsHostMock = mock<HttpArgumentsHost>();
      httpArgumentsHostMock.getRequest.mockReturnValue(requestMock);
      const contextMock = mock<ExecutionContext>();

      contextMock.switchToHttp.mockReturnValue(httpArgumentsHostMock);
      jwtServiceMock.verifyAsync.mockRejectedValue(new Error('verify error'));

      await expect(guard.canActivate(contextMock)).rejects.toThrow(
        UnauthorizedError,
      );
      expect(requestMock.user).toBeUndefined();
    });

    it('should throw UnauthorizedError if user session is blacklisted', async () => {
      const requestMock = {
        signedCookies: {
          access_token: 'random-token',
        } as { [key: string]: any },
      } as Request;
      const httpArgumentsHostMock = mock<HttpArgumentsHost>();
      httpArgumentsHostMock.getRequest.mockReturnValue(requestMock);
      const contextMock = mock<ExecutionContext>();

      contextMock.switchToHttp.mockReturnValue(httpArgumentsHostMock);
      jwtServiceMock.verifyAsync.mockRejectedValue(new Error('verify error'));
      tokenServiceMock.isSessionBlacklisted.mockResolvedValue(true);
      tokenServiceMock.isAccessTokenBlacklisted.mockResolvedValue(false);

      await expect(guard.canActivate(contextMock)).rejects.toThrow(
        UnauthorizedError,
      );
      expect(requestMock.user).toBeUndefined();
    });

    it('should throw UnauthorizedError if user access_token is blacklisted', async () => {
      const requestMock = {
        signedCookies: {
          access_token: 'random-token',
        } as { [key: string]: any },
      } as Request;
      const httpArgumentsHostMock = mock<HttpArgumentsHost>();
      httpArgumentsHostMock.getRequest.mockReturnValue(requestMock);
      const contextMock = mock<ExecutionContext>();

      contextMock.switchToHttp.mockReturnValue(httpArgumentsHostMock);
      jwtServiceMock.verifyAsync.mockRejectedValue(new Error('verify error'));
      tokenServiceMock.isSessionBlacklisted.mockResolvedValue(false);
      tokenServiceMock.isAccessTokenBlacklisted.mockResolvedValue(true);

      await expect(guard.canActivate(contextMock)).rejects.toThrow(
        UnauthorizedError,
      );
      expect(requestMock.user).toBeUndefined();
    });

    it('should set user to request if token verificaiton passed', async () => {
      const requestMock = {
        signedCookies: {
          access_token: 'random-token',
        } as { [key: string]: any },
      } as Request;
      const httpArgumentsHostMock = mock<HttpArgumentsHost>();
      const contextMock = mock<ExecutionContext>();

      httpArgumentsHostMock.getRequest.mockReturnValue(requestMock);
      contextMock.switchToHttp.mockReturnValue(httpArgumentsHostMock);
      tokenServiceMock.isSessionBlacklisted.mockResolvedValue(false);

      const sessionId = randomUUID();
      const userId = randomUserId();
      const email = randomEmail().getValue();
      const payload = mock<AccessTokenPayload>({
        sub: userId,
        email,
        sid: sessionId,
      });
      jwtServiceMock.verifyAsync.mockResolvedValue(payload);

      await expect(guard.canActivate(contextMock)).resolves.toBeTrue();

      expect(requestMock.user).toMatchObject<AuthenticatedUser>({
        userId,
        email,
        sessionId,
      });
    });
  });
});
