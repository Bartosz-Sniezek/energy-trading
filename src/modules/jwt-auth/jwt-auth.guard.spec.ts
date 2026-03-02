import { mock, mockReset } from 'vitest-mock-extended';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '@technical/app-config/app-config';
import { Request } from 'express';
import { ExecutionContext, HttpArgumentsHost } from '@nestjs/common/interfaces';
import { UnauthorizedException } from '@nestjs/common';
import { AccessTokenPayload, AuthenticatedUser } from '@domain/auth/types';
import { randomUserId } from 'test/faker/random-user-id';
import { randomEmail } from 'test/faker/random-email';
import { randomUUID } from 'crypto';

describe(JwtAuthGuard.name, () => {
  const jwtServiceMock = mock<JwtService>();
  const appConfigMock = mock<AppConfig>({
    values: {
      JWT_ACCESS_TOKEN_SECRET: 'secret',
    },
  });

  beforeEach(() => {
    mockReset(jwtServiceMock);
    mockReset(appConfigMock);
  });

  const guard = new JwtAuthGuard(jwtServiceMock, appConfigMock);

  describe(guard.canActivate.name, () => {
    it('should throw UnauthorizedException if there is no access_token in signed cookies', async () => {
      const requestMock = { signedCookies: {} } as Request;
      const httpArgumentsHostMock = mock<HttpArgumentsHost>();
      const contextMock = mock<ExecutionContext>();

      httpArgumentsHostMock.getRequest.mockReturnValue(requestMock);
      contextMock.switchToHttp.mockReturnValue(httpArgumentsHostMock);

      await expect(guard.canActivate(contextMock)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(requestMock.user).toBeUndefined();
    });

    it('should throw UnauthorizedException if token verificaiton failed', async () => {
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
        UnauthorizedException,
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
