import { Body, Controller, Param, Post, UsePipes } from '@nestjs/common';
import { Email } from '@domain/users/value-objects/email';
import { Password } from '@domain/users/value-objects/password';
import { ActivateUserAccountCommand } from '@modules/users/commands/activate-user-account.command';
import { CreateUserAccountCommand } from '@modules/users/commands/create-user-account.command';
import { RegisterUserDto } from './dtos/register-user.dto';
import { ZodValidationPipe } from 'nestjs-zod';

@Controller('users')
@UsePipes(ZodValidationPipe)
export class UsersController {
  constructor(
    private readonly createUserAccountCommand: CreateUserAccountCommand,
    private readonly activateUserAccountCommand: ActivateUserAccountCommand,
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

  @Post('/activate/:token')
  async activate(@Param('token') token: string): Promise<void> {
    await this.activateUserAccountCommand.execute({
      token,
    });
  }
}
