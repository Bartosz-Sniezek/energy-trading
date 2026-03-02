import { AuthenticatedUser } from '@domain/auth/types';
import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<Request>();

    if (!request.user) throw new UnauthorizedException('Missing user context');

    return request.user as AuthenticatedUser;
  },
);
