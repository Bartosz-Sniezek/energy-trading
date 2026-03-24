import { mock, mockReset } from 'vitest-mock-extended';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';
import { ExecutionContext, HttpArgumentsHost } from '@nestjs/common/interfaces';
import { AuthenticatedUser } from '@domain/auth/types';
import { randomUserId } from 'test/faker/random-user-id';
import { randomEmail } from 'test/faker/random-email';
import { randomUUID } from 'crypto';
import { UnauthorizedError } from '@domain/auth/errors/unauthorized.error';
import { JwtAuthService } from './jwt-auth.service';

describe(JwtAuthGuard.name, () => {
  const jwtAuthServiceMock = mock<JwtAuthService>();

  beforeEach(() => {
    mockReset(jwtAuthServiceMock);
  });

  const guard = new JwtAuthGuard(jwtAuthServiceMock);

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
      jwtAuthServiceMock.validate.mockRejectedValue(new Error('verify error'));

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

      const user = mock<AuthenticatedUser>({
        userId: randomUserId(),
        email: randomEmail().getValue(),
        sessionId: randomUUID(),
      });
      jwtAuthServiceMock.validate.mockResolvedValue(user);

      await expect(guard.canActivate(contextMock)).resolves.toBeTrue();

      expect(requestMock.user).toMatchObject<AuthenticatedUser>(user);
    });
  });
});
