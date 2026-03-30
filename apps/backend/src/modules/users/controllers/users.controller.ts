import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Email } from '@domain/users/value-objects/email';
import { Password } from '@domain/users/value-objects/password';
import { CreateUserAccountUseCase } from '@modules/users/use-cases/create-user-account.use-case';
import { RegisterUserDto } from './dtos/register-user.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import { MeDto } from './dtos/me.dto';
import { GetAuthenticatedUserProfileUseCase } from '../use-cases/get-authenticated-user-profile.use-case';
import { JwtAuthGuard } from '@modules/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '@modules/jwt-auth/current-user.decorator';
import type { AuthenticatedUser } from '@domain/auth/types';

@Controller('users')
@UsePipes(ZodValidationPipe)
export class UsersController {
  constructor(
    private readonly createUserAccountCommand: CreateUserAccountUseCase,
    private readonly getAuthenticatedUserProfileUseCase: GetAuthenticatedUserProfileUseCase,
  ) {}

  @Post()
  async create(@Body() dto: RegisterUserDto): Promise<void> {
    await this.createUserAccountCommand.execute({
      email: Email.create(dto.email),
      password: Password.create(dto.password),
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('/me')
  async me(@CurrentUser() user: AuthenticatedUser): Promise<MeDto> {
    return this.getAuthenticatedUserProfileUseCase.execute(user);
  }
}
