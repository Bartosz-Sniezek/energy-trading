import { UnauthorizedError } from '@domain/auth/errors/unauthorized.error';
import { TokenService } from '@domain/auth/services/token.service';
import {
  AccessToken,
  AccessTokenPayload,
  AuthenticatedUser,
} from '@domain/auth/types';
import { UserId } from '@domain/users/types';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '@technical/app-config/app-config';

@Injectable()
export class JwtAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly appConfig: AppConfig,
    private readonly tokenService: TokenService,
  ) {}

  async validate(accessToken: string): Promise<AuthenticatedUser> {
    const payload = await this.jwtService
      .verifyAsync<AccessTokenPayload>(accessToken, {
        secret: this.appConfig.values.JWT_ACCESS_TOKEN_SECRET,
      })
      .catch(() => {
        throw new UnauthorizedError();
      });

    const tokenChecks = await Promise.all([
      this.tokenService.isSessionBlacklisted(<UserId>payload.sub, payload.sid),
      this.tokenService.isAccessTokenBlacklisted(
        <UserId>payload.sub,
        <AccessToken>accessToken,
      ),
    ]);

    if (tokenChecks.filter((isBlacklisted) => isBlacklisted).length > 0) {
      throw new UnauthorizedError();
    }

    return {
      userId: <UserId>payload.sub,
      email: payload.email,
      sessionId: payload.sid,
    };
  }
}
