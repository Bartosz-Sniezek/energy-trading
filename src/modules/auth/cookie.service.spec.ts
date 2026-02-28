import { mock, mockReset } from 'vitest-mock-extended';
import { CookieService } from './cookie.service';
import { AppConfig } from '@technical/app-config/app-config';
import { type Response } from 'express';
import { randomBytes } from 'crypto';
import { AccessToken, RefreshToken } from '@domain/auth/types';

describe(CookieService.name, () => {
  const appConfigMock = mock<AppConfig>({
    values: {
      JWT_ACCESS_TOKEN_EXPIRATION_SEC: 60,
      JWT_REFRESH_TOKEN_EXPIRATION_SEC: 120,
    },
  });
  const accessToken = randomBytes(64).toString('hex') as AccessToken;
  const refreshToken = randomBytes(64).toString('hex') as RefreshToken;
  const resMock = mock<Response>();
  const cookieService = new CookieService(appConfigMock);
  const options = {
    response: resMock,
    accessToken,
    refreshToken,
  };

  beforeEach(() => {
    mockReset(appConfigMock);
    mockReset(resMock);
  });

  describe(cookieService.configure.name, () => {
    describe('NODE_ENV=production', () => {
      beforeEach(() => {
        appConfigMock.isProduction.mockReturnValue(true);
      });

      it('should set access_token cookie', () => {
        cookieService.configure(options);

        expect(resMock.cookie).toHaveBeenCalledWith(
          'access_token',
          accessToken,
          {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: appConfigMock.values.JWT_ACCESS_TOKEN_EXPIRATION_SEC * 1000,
          },
        );
      });

      it('should set refresh_token cookie', () => {
        cookieService.configure(options);

        expect(resMock.cookie).toHaveBeenCalledWith(
          'refresh_token',
          refreshToken,
          {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/api/auth/refresh',
            maxAge:
              appConfigMock.values.JWT_REFRESH_TOKEN_EXPIRATION_SEC * 1000,
          },
        );
      });

      it('should call response.cookie exactly twice', () => {
        cookieService.configure(options);

        expect(resMock.cookie).toHaveBeenCalledWith(
          'access_token',
          accessToken,
          {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: appConfigMock.values.JWT_ACCESS_TOKEN_EXPIRATION_SEC * 1000,
          },
        );
        expect(resMock.cookie).toHaveBeenCalledWith(
          'refresh_token',
          refreshToken,
          {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/api/auth/refresh',
            maxAge:
              appConfigMock.values.JWT_REFRESH_TOKEN_EXPIRATION_SEC * 1000,
          },
        );

        expect(resMock.cookie).toHaveBeenCalledTimes(2);
      });
    });

    describe('NODE_ENV != production', () => {
      beforeEach(() => {
        appConfigMock.isProduction.mockReturnValue(false);
      });

      it('should set access_token cookie', () => {
        cookieService.configure(options);

        expect(resMock.cookie).toHaveBeenCalledWith(
          'access_token',
          accessToken,
          {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: appConfigMock.values.JWT_ACCESS_TOKEN_EXPIRATION_SEC * 1000,
          },
        );
      });

      it('should set refresh_token cookie', () => {
        cookieService.configure(options);

        expect(resMock.cookie).toHaveBeenCalledWith(
          'refresh_token',
          refreshToken,
          {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/api/auth/refresh',
            maxAge:
              appConfigMock.values.JWT_REFRESH_TOKEN_EXPIRATION_SEC * 1000,
          },
        );
      });

      it('should call response.cookie exactly twice', () => {
        cookieService.configure(options);

        expect(resMock.cookie).toHaveBeenCalledWith(
          'access_token',
          accessToken,
          {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: appConfigMock.values.JWT_ACCESS_TOKEN_EXPIRATION_SEC * 1000,
          },
        );
        expect(resMock.cookie).toHaveBeenCalledWith(
          'refresh_token',
          refreshToken,
          {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/api/auth/refresh',
            maxAge:
              appConfigMock.values.JWT_REFRESH_TOKEN_EXPIRATION_SEC * 1000,
          },
        );

        expect(resMock.cookie).toHaveBeenCalledTimes(2);
      });
    });
  });
});
