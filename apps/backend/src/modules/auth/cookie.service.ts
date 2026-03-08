import { AccessToken, RefreshToken } from '@domain/auth/types';
import { Injectable } from '@nestjs/common';
import { AppConfig } from '@technical/app-config/app-config';
import { type Response } from 'express';

export interface ConfigureOptions {
  response: Response;
  accessToken: AccessToken;
  refreshToken: RefreshToken;
}

@Injectable()
export class CookieService {
  private readonly accessTokenMaxAge: number;
  private readonly refreshTokenMaxAge: number;
  private readonly accessTokenCookie = 'access_token';
  private readonly refreshTokenCookie = 'refresh_token';
  private readonly apiRefreshPath = '/api/auth/refresh';

  constructor(private readonly appConfig: AppConfig) {
    this.accessTokenMaxAge =
      appConfig.values.JWT_ACCESS_TOKEN_EXPIRATION_SEC * 1000;
    this.refreshTokenMaxAge =
      appConfig.values.JWT_REFRESH_TOKEN_EXPIRATION_SEC * 1000;
  }

  configure({
    response: res,
    accessToken,
    refreshToken,
  }: ConfigureOptions): void {
    const httpOnly = true;
    const secure = this.appConfig.isProduction();
    const sameSite = secure ? 'strict' : 'lax';

    res.cookie(this.accessTokenCookie, accessToken, {
      httpOnly,
      secure,
      sameSite,
      maxAge: this.accessTokenMaxAge,
      signed: true,
    });

    res.cookie(this.refreshTokenCookie, refreshToken, {
      httpOnly,
      secure,
      sameSite,
      path: this.apiRefreshPath,
      maxAge: this.refreshTokenMaxAge,
      signed: true,
    });
  }

  removeTokens(response: Response): void {
    response.clearCookie(this.accessTokenCookie);
    response.clearCookie(this.refreshTokenCookie, {
      path: this.apiRefreshPath,
    });
  }
}
