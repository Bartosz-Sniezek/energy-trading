import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { LoginUseCase } from './use-cases/login.use-case';
import { LoginDto } from './dtos/login.dto';
import { Email } from '@domain/users/value-objects/email';
import type { Request, Response } from 'express';
import { CookieService } from './cookie.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { NotAuthenticatedGuard } from './not-authenticated.guard';
import { JwtAuthGuard } from '@modules/jwt-auth/jwt-auth.guard';
import { LogoutUseCase } from './use-cases/logout.use-case';
import type { AuthenticatedUser, RefreshToken } from '@domain/auth/types';
import { CurrentUser } from '@modules/jwt-auth/current-user.decorator';
import { RotateTokenUseCase } from './use-cases/rotate-token.use-case';

@Controller('auth')
@UsePipes(ZodValidationPipe)
export class AuthController {
  constructor(
    private readonly cookieService: CookieService,
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly rotateTokenUseCase: RotateTokenUseCase,
  ) {}

  @UseGuards(NotAuthenticatedGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body()
    body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const tokens = await this.loginUseCase.execute({
      email: Email.create(body.email),
      password: body.password,
    });

    this.cookieService.configure({
      response,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    return;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const cookieRefreshToken = request.signedCookies['refresh_token'] as
      | RefreshToken
      | undefined;

    if (!cookieRefreshToken) throw new UnauthorizedException();

    const { accessToken, refreshToken } =
      await this.rotateTokenUseCase.execute(cookieRefreshToken);

    this.cookieService.configure({
      response,
      accessToken,
      refreshToken,
    });

    return;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Res({ passthrough: true }) response: Response,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    this.cookieService.removeTokens(response);

    await this.logoutUseCase.execute(user.userId, user.sessionId);

    return;
  }
}
