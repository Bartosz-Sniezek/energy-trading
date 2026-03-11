import { AlreadyAuthenticatedError } from '@domain/auth/errors/already-authenticated.error';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class NotAuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();

    if (request?.signedCookies?.access_token) {
      throw new AlreadyAuthenticatedError();
    }

    return true;
  }
}
