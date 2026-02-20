import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import { UserEntity } from '@modules/users/entities/user.entity';
import { AppTestingFixture } from 'test/helpers/app-testing-fixture';
import { ActivateUserAccountCommand } from '@modules/users/commands/activate-user-account.command';
import { UserOutboxEntity } from '@modules/users/entities/users-outbox.entity';
import { EmailVerificationTokenExpiredError } from '@modules/users/errors/email-verification-token-expired.error';
import { UsersFixture } from 'test/fixtures/users-fixture';
import { InvalidVerificationTokenError } from '@modules/users/errors/invalid-verification-token.error';
import { addDays } from 'date-fns';
import { UserAccountAlreadyActivatedError } from '@modules/users/errors/user-account-already-activated.error';
import { UserEvents } from '@domain/users/events.enum';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { vi } from 'vitest';
import { UserAccountActivatedPayload } from '@modules/users/entities/schemas/outbox-payload.schema';

describe(ActivateUserAccountCommand.name, () => {
  let testingFixture: AppTestingFixture;
  let app: INestApplication<App>;
  let command: ActivateUserAccountCommand;
  let usersRepository: Repository<UserEntity>;
  let usersFixture: UsersFixture;
  let datetimeService: DatetimeService;

  beforeAll(async () => {
    testingFixture = await AppTestingFixture.create({ mockKafka: true });
    app = testingFixture.getApp();
    command = app.get(ActivateUserAccountCommand);
    usersRepository = testingFixture.getRepository(UserEntity);
    usersFixture = testingFixture.getUsersFixture();
    datetimeService = app.get(DatetimeService);
  });

  beforeEach(async () => await testingFixture.truncateDatabase());

  afterEach(() => vi.resetAllMocks());

  afterAll(async () => {
    await app.close();
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
      const now = new Date('2026-02-01');
      vi.spyOn(datetimeService, 'new').mockReturnValue(now);
      const user = await usersFixture.createUser();

      vi.spyOn(datetimeService, 'new').mockReturnValue(addDays(now, 2));
      await expect(
        command.execute({
          token: user.activationToken,
        }),
      ).rejects.toThrow(EmailVerificationTokenExpiredError);
    });

    it('should throw EmailVerificationTokenExpiredError after 24 hours', async () => {
      const now = new Date('2026-02-01');
      vi.spyOn(datetimeService, 'new').mockReturnValue(now);
      const user = await usersFixture.createUser();
      // 1ms after 24h from now
      const expiredDate = new Date(addDays(now, 1).getTime() + 1);
      // vi.resetAllMocks();
      vi.spyOn(datetimeService, 'new').mockReturnValue(expiredDate);

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
        id: expect.any(String),
        aggregateId: user.id,
        eventType: UserEvents.USER_ACCOUNT_ACTIVATED,
        payload: expect.objectContaining<UserAccountActivatedPayload>({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }),
        createdAt: expect.any(Date),
      });
    });

    it('should be possible to activate it within 24 hours', async () => {
      const now = new Date('2026-01-01');
      vi.spyOn(datetimeService, 'new').mockReturnValue(now);
      const user = await usersFixture.createUser();

      // upper datetime constraint
      vi.spyOn(datetimeService, 'new').mockReturnValue(addDays(now, 1));
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
        payload: expect.objectContaining<UserAccountActivatedPayload>({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }),
        createdAt: expect.toBeDate(),
      });
    });
  });
});
