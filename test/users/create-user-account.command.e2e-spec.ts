import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { CreateUserAccountCommand } from '@modules/users/commands/create-user-account.command';
import { Email } from '@domain/users/value-objects/email';
import { Password } from '@domain/users/value-objects/password';
import { Repository } from 'typeorm';
import { UserEntity } from '@src/modules/users/entities/user.entity';
import { UserOutboxEntity } from '@src/modules/users/entities/users-outbox.entity';
import { EmailVerificationTokenEntity } from '@src/modules/users/entities/email-verification-token.entity';
import { UserEvents } from '@src/domain/users/events.enum';
import { DatetimeService } from '@src/technical/datetime/datetime.service';
import { randomEmail } from 'test/faker/random-email';
import { AppTestingFixture } from 'test/helpers/app-testing-fixture';

describe(CreateUserAccountCommand.name, () => {
  let testingFixture: AppTestingFixture;
  let app: INestApplication<App>;
  let usersService: CreateUserAccountCommand;
  let usersRepository: Repository<UserEntity>;
  let usersOutboxRepository: Repository<UserOutboxEntity>;
  let emailVerificationRepository: Repository<EmailVerificationTokenEntity>;
  let datetimeService: DatetimeService;

  beforeEach(async () => {
    testingFixture = await AppTestingFixture.create();
    app = testingFixture.getApp();
    usersService = app.get(CreateUserAccountCommand);
    usersRepository = testingFixture.getRepository(UserEntity);
    usersOutboxRepository = testingFixture.getRepository(UserOutboxEntity);
    emailVerificationRepository = testingFixture.getRepository(
      EmailVerificationTokenEntity,
    );
    datetimeService = app.get(DatetimeService);
  });

  beforeEach(async () => await testingFixture.truncateDatabase());

  afterAll(async () => {
    app.close();
  });

  describe('when user account with given email does not exist', () => {
    it('should create a new user account', async () => {
      const email = Email.create('test@example.pl');
      const password = Password.create('Qwerty12345!');
      const firstName = 'Test';
      const lastName = 'Example';

      await expect(
        usersService.execute({
          email,
          password,
          firstName,
          lastName,
        }),
      ).toResolve();

      const user = await usersRepository.findOneByOrFail({
        email: email.getValue(),
      });
      const emailVerificationToken =
        await emailVerificationRepository.findOneByOrFail({
          userId: user.id,
        });
      const userOutboxEvent = await usersOutboxRepository.findOneByOrFail({
        aggregateId: user.id,
        eventType: UserEvents.USER_ACCOUNT_REGISTERED,
      });

      expect(user).toMatchObject<UserEntity>({
        id: expect.toBeString(),
        email: email.getValue(),
        passwordHash: expect.toBeString(),
        firstName,
        lastName,
        isActive: false,
        updatedAt: expect.toBeDate(),
        createdAt: expect.toBeDate(),
      });
      expect(user.passwordHash).not.toBe(password.getValue());

      expect(
        emailVerificationToken,
      ).toMatchObject<EmailVerificationTokenEntity>({
        id: expect.toBeString(),
        userId: user.id,
        token: expect.toBeString(),
        expiresAt: expect.toBeDate(),
        createdAt: expect.toBeDate(),
      });

      expect(userOutboxEvent).toMatchObject<UserOutboxEntity>({
        id: expect.toBeString(),
        aggregateId: user.id,
        eventType: UserEvents.USER_ACCOUNT_REGISTERED,
        payload: {
          email: email.getValue(),
          firstName,
          lastName,
        },
        processed: false,
        processedAt: null,
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
      let existingUser: UserEntity;

      await usersService.execute({
        email,
        password,
        firstName,
        lastName,
      });

      existingUser = await usersRepository.findOneByOrFail({
        email: email.getValue(),
      });

      await expect(
        usersService.execute({
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
        id: expect.toBeString(),
        aggregateId: existingUser.id,
        eventType:
          UserEvents.USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT,
        payload: {
          email: email.getValue(),
        },
        processed: false,
        processedAt: null,
        createdAt: expect.toBeDate(),
      });
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent registration attempts', async () => {
      const email = Email.create('concurrent@example.pl');
      const password = Password.create('Qwerty12345!');

      await Promise.all([
        usersService.execute({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
        }),
        usersService.execute({
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
        usersService.execute({
          email: email1,
          password: password1,
          firstName: 'Test',
          lastName: 'User',
        }),
        usersService.execute({
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

      const user1Token = await emailVerificationRepository.findBy({
        userId: user1.id,
      });
      const user2Token = await emailVerificationRepository.findBy({
        userId: user2.id,
      });

      expect(user1Token).toHaveLength(1);
      expect(user2Token).toHaveLength(1);
      expect(user1Token[0].token).not.toBe(user2Token[0].token);
    });

    it('should set correct token expiration time', async () => {
      const email = randomEmail();
      const password1 = Password.create('Qwerty12345!');

      await usersService.execute({
        email: email,
        password: password1,
        firstName: 'Test',
        lastName: 'User',
      });

      const user = await usersRepository.findOneByOrFail({
        email: email.getValue(),
      });

      const { expiresAt } = await emailVerificationRepository.findOneByOrFail({
        userId: user.id,
      });

      expect(expiresAt.getTime()).toBe(
        datetimeService.getDateIn24Hours(user.createdAt).getTime(),
      );
    });
  });
});
