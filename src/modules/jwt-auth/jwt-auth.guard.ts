import { AccessTokenPayload } from '@domain/auth/types';
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

      request.user = {
        userId: payload.sub,
        email: payload.email,
      };
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }
}
