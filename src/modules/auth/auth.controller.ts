import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { LoginUseCase } from './use-cases/login.use-case';
import { LoginDto } from './dtos/login.dto';
import { Email } from '@domain/users/value-objects/email';
import type { Response } from 'express';
import { CookieService } from './cookie.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { NotAuthenticatedGuard } from './not-authenticated.guard';

@Controller('auth')
@UsePipes(ZodValidationPipe)
export class AuthController {
  constructor(
    private readonly cookieService: CookieService,
    private readonly loginUseCase: LoginUseCase,
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
}
