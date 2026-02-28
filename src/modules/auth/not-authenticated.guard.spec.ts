import { mock } from 'vitest-mock-extended';
import { NotAuthenticatedGuard } from './not-authenticated.guard';
import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

describe(NotAuthenticatedGuard.name, () => {
  const guard = new NotAuthenticatedGuard();

  describe(guard.canActivate.name, async () => {
    it('should throw BadRequestException when signed cookie with access_token is present', async () => {
      const contextMock = mock<ExecutionContext>();
      const requestMock = mock<Request>({
        signedCookies: { access_token: 'token' },
      });
      const httpArgumentsHostMock = mock<HttpArgumentsHost>();
      httpArgumentsHostMock.getRequest.mockReturnValue(requestMock);
      contextMock.switchToHttp.mockReturnValue(httpArgumentsHostMock);

      expect(() => guard.canActivate(contextMock)).toThrow(
        new BadRequestException('Already authenticated'),
      );
    });

    it('should return true if access_token is not present in signed cookies', async () => {
      const contextMock = mock<ExecutionContext>();
      const requestMock = {
        signedCookies: {},
      } as Request;
      const httpArgumentsHostMock = mock<HttpArgumentsHost>();
      httpArgumentsHostMock.getRequest.mockReturnValue(requestMock);
      contextMock.switchToHttp.mockReturnValue(httpArgumentsHostMock);

      expect(guard.canActivate(contextMock)).toBeTrue();
    });

    it('should return true if there are no signed cookies', async () => {
      const contextMock = mock<ExecutionContext>();
      const requestMock = {} as Request;
      const httpArgumentsHostMock = mock<HttpArgumentsHost>();
      httpArgumentsHostMock.getRequest.mockReturnValue(requestMock);
      contextMock.switchToHttp.mockReturnValue(httpArgumentsHostMock);

      expect(guard.canActivate(contextMock)).toBeTrue();
    });
  });
});
