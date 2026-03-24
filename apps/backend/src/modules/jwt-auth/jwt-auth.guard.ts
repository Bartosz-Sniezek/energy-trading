import { UnauthorizedError } from '@domain/auth/errors/unauthorized.error';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthService } from './jwt-auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtAuthService: JwtAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.signedCookies.access_token as string | undefined;

    if (!token) throw new UnauthorizedError();

    request.user = await this.jwtAuthService.validate(token).catch(() => {
      throw new UnauthorizedError();
    });

    return true;
  }
}
