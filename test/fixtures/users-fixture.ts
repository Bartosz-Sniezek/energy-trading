import { Email } from '@domain/users/value-objects/email';
import { Password } from '@domain/users/value-objects/password';
import { CreateUserAccountCommand } from '@modules/users/commands/create-user-account.command';
import { UserEntity } from '@modules/users/entities/user.entity';
import { UserOutboxEntity } from '@modules/users/entities/users-outbox.entity';
import { UserId } from '@modules/users/types';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { App } from 'supertest/types';
import { randomEmail } from 'test/faker/random-email';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { randomPassword } from 'test/faker/random-password';
import { Repository } from 'typeorm';

export interface UserCredentials {
  user: UserEntity;
  email: Email;
  password: Password;
}

export class UsersFixture {
  private readonly usersRepository: Repository<UserEntity>;
  private readonly usersOutboxRepository: Repository<UserOutboxEntity>;
  private readonly createUserAccountCommand: CreateUserAccountCommand;

  constructor(app: INestApplication<App>) {
    this.usersRepository = app.get(getRepositoryToken(UserEntity));
    this.usersOutboxRepository = app.get(getRepositoryToken(UserOutboxEntity));
    this.createUserAccountCommand = app.get(CreateUserAccountCommand);
  }

  async createUser(): Promise<UserEntity> {
    const email = randomEmail();
    const password = randomPassword();
    const firstName = randomFirstName();
    const lastName = randomLastName();

    await this.createUserAccountCommand.execute({
      email,
      password,
      firstName,
      lastName,
    });

    return this.usersRepository.findOneByOrFail({
      email: email.getValue(),
    });
  }

  async createActivatedUser(): Promise<UserCredentials> {
    const email = randomEmail();
    const password = randomPassword();
    const firstName = randomFirstName();
    const lastName = randomLastName();

    await this.createUserAccountCommand.execute({
      email,
      password,
      firstName,
      lastName,
    });

    await this.usersRepository.update(
      {
        email: email.getValue(),
      },
      {
        isActive: true,
      },
    );

    const user = await this.usersRepository.findOneByOrFail({
      email: email.getValue(),
    });

    return {
      user,
      email,
      password,
    };
  }

  async getOutboxEvents(userId: UserId): Promise<UserOutboxEntity[]> {
    return this.usersOutboxRepository.findBy({
      aggregateId: userId,
    });
  }
}
