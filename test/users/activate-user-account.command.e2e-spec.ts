import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import { UserEntity } from '@modules/users/entities/user.entity';
import { AppTestingFixture } from 'test/helpers/app-testing-fixture';
import { ActivateUserAccountCommand } from '@modules/users/commands/activate-user-account.command';
import { UserOutboxEntity } from '@modules/users/entities/users-outbox.entity';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { EmailVerificationTokenExpiredError } from '@modules/users/errors/email-verification-token-expired.error';
import { CreateUserAccountCommand } from '@modules/users/commands/create-user-account.command';
import { UsersFixture } from 'test/fixtures/users-fixture';
import { InvalidVerificationTokenError } from '@modules/users/errors/invalid-verification-token.error';
import { subDays } from 'date-fns';
import { UserAccountAlreadyActivatedError } from '@modules/users/errors/user-account-already-activated.error';
import { UserEvents } from '@domain/users/events.enum';
import { OutboxEntity } from '@common/abstract/outbox.entity';

describe(ActivateUserAccountCommand.name, () => {
  let testingFixture: AppTestingFixture;
  let app: INestApplication<App>;
  let command: ActivateUserAccountCommand;
  let createUserCommand: CreateUserAccountCommand;
  let usersRepository: Repository<UserEntity>;
  let usersOutboxRepository: Repository<UserOutboxEntity>;
  let datetimeService: DatetimeService;
  let usersFixture: UsersFixture;

  beforeAll(async () => {
    testingFixture = await AppTestingFixture.create();
    app = testingFixture.getApp();
    command = app.get(ActivateUserAccountCommand);
    createUserCommand = app.get(CreateUserAccountCommand);
    usersRepository = testingFixture.getRepository(UserEntity);
    usersOutboxRepository = testingFixture.getRepository(UserOutboxEntity);
    datetimeService = app.get(DatetimeService);
    usersFixture = testingFixture.getUsersFixture();
  });

  beforeEach(async () => await testingFixture.truncateDatabase());

  afterAll(async () => {
    app.close();
  });

  describe('when user account does not exist', () => {
    it('should throw InvalidVerificationTokenError', async () => {
      await expect(
        command.execute({
          token: 'token',
        }),
      ).rejects.toThrow(InvalidVerificationTokenError);
    });
  });

  describe('when token expired', () => {
    it('should throw EmailVerificationTokenExpiredError', async () => {
      const user = await usersFixture.createUser();

      await usersRepository.update(
        {
          id: user.id,
        },
        {
          activationTokenExpiresAt: subDays(user.activationTokenExpiresAt, 2),
        },
      );

      await expect(
        command.execute({
          token: user.activationToken,
        }),
      ).rejects.toThrow(EmailVerificationTokenExpiredError);
    });
  });

  describe('when user account is active', () => {
    it('should throw UserAccountAlreadyActivatedError', async () => {
      const user = await usersFixture.createUser();

      await usersRepository.update(
        {
          id: user.id,
        },
        {
          isActive: true,
        },
      );

      await expect(
        command.execute({
          token: user.activationToken,
        }),
      ).rejects.toThrow(UserAccountAlreadyActivatedError);
    });
  });

  describe('when user account is created', () => {
    it('should be possible to activate it', async () => {
      const user = await usersFixture.createUser();

      await expect(
        command.execute({
          token: user.activationToken,
        }),
      ).toResolve();

      const events = await usersFixture.getOutboxEvents(user.id);
      // user created + account activated
      expect(events).toHaveLength(2);

      const userActivatedEvent = events.filter(
        (ev) => ev.eventType === UserEvents.USER_ACCOUNT_ACTIVATED,
      )[0];

      expect(userActivatedEvent).toBeDefined();
      expect(userActivatedEvent).toMatchObject<UserOutboxEntity>({
        id: expect.toBeString(),
        aggregateId: user.id,
        eventType: UserEvents.USER_ACCOUNT_ACTIVATED,
        payload: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        processed: false,
        processedAt: null,
        createdAt: expect.toBeDate(),
      });
    });
  });
});
