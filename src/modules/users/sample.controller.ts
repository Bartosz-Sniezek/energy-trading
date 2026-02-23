import { Controller, Param, Post } from '@nestjs/common';
import { CreateUserAccountCommand } from './commands/create-user-account.command';
import { ActivateUserAccountCommand } from './commands/activate-user-account.command';
import { Email } from '@domain/users/value-objects/email';
import { Password } from '@domain/users/value-objects/password';

@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserAccountCommand: CreateUserAccountCommand,
    private readonly activateUserAccountCommand: ActivateUserAccountCommand,
  ) {}

  @Post()
  async create(): Promise<void> {
    await this.createUserAccountCommand.execute({
      email: Email.create('test@example.com'),
      password: Password.create('Qwerty1234!@#$'),
      firstName: 'Bart',
      lastName: 'Sni',
    });
  }

  @Post('/activate/:token')
  async activate(@Param('token') token: string): Promise<void> {
    await this.activateUserAccountCommand.execute({
      token,
    });
  }
}
