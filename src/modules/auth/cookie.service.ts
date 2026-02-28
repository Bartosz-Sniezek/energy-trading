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

    res.cookie('access_token', accessToken, {
      httpOnly,
      secure,
      sameSite,
      maxAge: this.accessTokenMaxAge,
      signed: true,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly,
      secure,
      sameSite,
      path: '/api/auth/refresh',
      maxAge: this.refreshTokenMaxAge,
      signed: true,
    });
  }
}
