import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { CreateUserAccountCommand } from '@modules/users/commands/create-user-account.command';
import { Email } from '@domain/users/value-objects/email';
import { Password } from '@domain/users/value-objects/password';
import { Repository } from 'typeorm';
import { randomEmail } from 'test/faker/random-email';
import { AppTestingFixture } from 'test/helpers/app-testing-fixture';
import { UserEvents } from '@domain/users/events.enum';
import { UserEntity } from '@modules/users/entities/user.entity';
import { UserOutboxEntity } from '@modules/users/entities/users-outbox.entity';
import { DatetimeService } from '@technical/datetime/datetime.service';
import {
  UserAccountCreatedPayload,
  UserAccountRegistrationAttemptedPayload,
} from '@modules/users/entities/schemas/outbox-payload.schema';

describe(CreateUserAccountCommand.name, () => {
  let testingFixture: AppTestingFixture;
  let app: INestApplication<App>;
  let createUserAccountCommand: CreateUserAccountCommand;
  let usersRepository: Repository<UserEntity>;
  let usersOutboxRepository: Repository<UserOutboxEntity>;
  let datetimeService: DatetimeService;

  beforeAll(async () => {
    testingFixture = await AppTestingFixture.create({ mockKafka: true });
    app = testingFixture.getApp();
    createUserAccountCommand = app.get(CreateUserAccountCommand);
    usersRepository = testingFixture.getRepository(UserEntity);
    usersOutboxRepository = testingFixture.getRepository(UserOutboxEntity);
    datetimeService = app.get(DatetimeService);
  });

  beforeEach(async () => await testingFixture.truncateDatabase());

  afterAll(async () => {
    await app.close();
  });

  describe('when user account with given email does not exist', () => {
    it('should create a new user account', async () => {
      const email = Email.create('test@example.pl');
      const password = Password.create('Qwerty12345!');
      const firstName = 'Test';
      const lastName = 'Example';

      await expect(
        createUserAccountCommand.execute({
          email,
          password,
          firstName,
          lastName,
        }),
      ).toResolve();

      const user = await usersRepository.findOneByOrFail({
        email: email.getValue(),
      });
      const userOutboxEvent = await usersOutboxRepository.findOneByOrFail({
        aggregateId: user.id,
        eventType: UserEvents.USER_ACCOUNT_REGISTERED,
      });

      expect(user).toMatchObject<UserEntity>({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        id: expect.toBeString(),
        email: email.getValue(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        passwordHash: expect.toBeString(),
        firstName,
        lastName,
        isActive: false,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        activationToken: expect.toBeString(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        activationTokenExpiresAt: expect.toBeDate(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        updatedAt: expect.toBeDate(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        createdAt: expect.toBeDate(),
      });
      expect(user.passwordHash).not.toBe(password.getValue());

      expect(userOutboxEvent).toMatchObject<UserOutboxEntity>({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        id: expect.toBeString(),
        aggregateId: user.id,
        eventType: UserEvents.USER_ACCOUNT_REGISTERED,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        payload: expect.objectContaining<UserAccountCreatedPayload>({
          email: email.getValue(),
          firstName,
          lastName,
          activationToken: user.activationToken,
          activationTokenExpirationDate:
            user.activationTokenExpiresAt.toISOString(),
        }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        createdAt: expect.toBeDate(),
      });
    });
  });

  describe('when user account with given email exists', () => {
    it('should not throw when using email address', async () => {
      const email = Email.create('existing@example.pl');
      const password = Password.create('Qwerty12345!');
      const firstName = 'Existing';
      const lastName = 'Example';

      await createUserAccountCommand.execute({
        email,
        password,
        firstName,
        lastName,
      });

      const existingUser = await usersRepository.findOneByOrFail({
        email: email.getValue(),
      });

      await expect(
        createUserAccountCommand.execute({
          email,
          password,
          firstName,
          lastName,
        }),
      ).toResolve();

      await expect(
        usersRepository.findBy({
          email: email.getValue(),
        }),
      ).resolves.toHaveLength(1);

      const outboxEvent = await usersOutboxRepository.findOneByOrFail({
        aggregateId: existingUser.id,
        eventType:
          UserEvents.USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT,
      });

      expect(outboxEvent).toMatchObject<UserOutboxEntity>({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        id: expect.toBeString(),
        aggregateId: existingUser.id,
        eventType:
          UserEvents.USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        payload:
          expect.objectContaining<UserAccountRegistrationAttemptedPayload>({
            email: email.getValue(),
            firstName,
            lastName,
          }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        createdAt: expect.toBeDate(),
      });
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent registration attempts', async () => {
      const email = Email.create('concurrent@example.pl');
      const password = Password.create('Qwerty12345!');

      await Promise.all([
        createUserAccountCommand.execute({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
        }),
        createUserAccountCommand.execute({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
        }),
      ]);

      const users = await usersRepository.findBy({ email: email.getValue() });
      expect(users).toHaveLength(1);
    });

    it('should create different tokens for each registration', async () => {
      const email1 = Email.create('email1@example.pl');
      const password1 = Password.create('Qwerty12345!');
      const email2 = Email.create('email2@example.pl');
      const password2 = Password.create('Qwerty12345!');

      await Promise.all([
        createUserAccountCommand.execute({
          email: email1,
          password: password1,
          firstName: 'Test',
          lastName: 'User',
        }),
        createUserAccountCommand.execute({
          email: email2,
          password: password2,
          firstName: 'Test',
          lastName: 'User',
        }),
      ]);

      const user1 = await usersRepository.findOneByOrFail({
        email: email1.getValue(),
      });
      const user2 = await usersRepository.findOneByOrFail({
        email: email2.getValue(),
      });

      expect(user1.activationToken).not.toBe(user2.activationToken);
    });

    it('should set correct token expiration time', async () => {
      const email = randomEmail();
      const password1 = Password.create('Qwerty12345!');

      await createUserAccountCommand.execute({
        email: email,
        password: password1,
        firstName: 'Test',
        lastName: 'User',
      });

      const user = await usersRepository.findOneByOrFail({
        email: email.getValue(),
      });

      expect(user.activationTokenExpiresAt.getTime()).toBe(
        datetimeService.getDateIn24Hours(user.createdAt).getTime(),
      );
    });
  });
});
