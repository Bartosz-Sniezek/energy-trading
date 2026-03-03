import { TokenService } from '@domain/auth/services/token.service';
import {
  AccessToken,
  AccessTokenPayload,
  AuthenticatedUser,
} from '@domain/auth/types';
import { UserId } from '@modules/users/types';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '@technical/app-config/app-config';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly appConfig: AppConfig,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.signedCookies.access_token as string | undefined;

    if (!token) throw new UnauthorizedException();

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
        {
          secret: this.appConfig.values.JWT_ACCESS_TOKEN_SECRET,
        },
      );

      const tokenChecks = await Promise.all([
        this.tokenService.isSessionBlacklisted(
          <UserId>payload.sub,
          payload.sid,
        ),
        this.tokenService.isAccessTokenBlacklisted(
          <UserId>payload.sub,
          <AccessToken>token,
        ),
      ]);

      if (tokenChecks.filter((isBlacklisted) => isBlacklisted).length > 0) {
        throw new UnauthorizedException();
      }

      request.user = <AuthenticatedUser>{
        userId: payload.sub,
        email: payload.email,
        sessionId: payload.sid,
      };
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }
}
