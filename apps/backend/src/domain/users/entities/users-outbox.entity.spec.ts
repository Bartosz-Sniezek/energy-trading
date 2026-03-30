import { UserEvents } from '@domain/users/events.enum';
import {
  UserAccountActivatedPayload,
  UserAccountCreatedPayload,
  UserAccountRegistrationAttemptedPayload,
} from '@domain/users/entities/schemas/outbox-payload.schema';
import { UserOutboxEntity } from '@domain/users/entities/users-outbox.entity';
import { InvalidPayloadDataError } from '@common/errors/invalid-payload-data.error';
import { UserId } from '@domain/users/types';
import { randomBytes } from 'crypto';
import { randomEmail } from 'test/faker/random-email';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { v7 as uuidv7 } from 'uuid';
import { randomCorrelationId } from 'test/faker/random-correlation-id';

describe(UserOutboxEntity.name, () => {
  const userId = <UserId>uuidv7();
  const firstName = randomFirstName();
  const lastName = randomLastName();
  const email = randomEmail().getValue();
  const activationToken = randomBytes(32).toString('hex');
  const activationTokenExpirationDate = new Date().toISOString();
  const correlationId = randomCorrelationId();

  describe(`${UserOutboxEntity.userAccountRegistered.name}`, () => {
    it(`should create ${UserEvents.USER_ACCOUNT_REGISTERED} user outbox event`, () => {
      const event = UserOutboxEntity.userAccountRegistered(
        userId,
        correlationId,
        {
          email,
          firstName,
          lastName,
          activationToken,
          activationTokenExpirationDate,
        },
      );

      expect(event.userId).toBe(userId);
      expect(event.aggregateId).toBe(userId);
      expect(event.eventType).toBe(UserEvents.USER_ACCOUNT_REGISTERED);
      expect(event.payload).toMatchObject<UserAccountCreatedPayload>({
        email,
        firstName,
        lastName,
        activationToken,
        activationTokenExpirationDate,
      });
    });

    it(`should create ${UserEvents.USER_ACCOUNT_REGISTERED} without additional fields in payload`, () => {
      const event = UserOutboxEntity.userAccountRegistered(
        userId,
        correlationId,
        {
          email,
          firstName,
          lastName,
          activationToken,
          activationTokenExpirationDate,
          newField: 123,
        } as UserAccountCreatedPayload,
      );

      expect(event.aggregateId).toBe(userId);
      expect(event.eventType).toBe(UserEvents.USER_ACCOUNT_REGISTERED);
      expect(event.payload).toMatchObject<UserAccountCreatedPayload>({
        email,
        firstName,
        lastName,
        activationToken,
        activationTokenExpirationDate,
      });
    });

    it(`should throw ${InvalidPayloadDataError.name} for invalid payload`, () => {
      expect(() =>
        UserOutboxEntity.userAccountRegistered(
          userId,
          correlationId,
          {} as any,
        ),
      ).toThrow(InvalidPayloadDataError);
    });

    it(`should include field errors in ${InvalidPayloadDataError.name}`, () => {
      try {
        UserOutboxEntity.userAccountRegistered(
          userId,
          correlationId,
          {} as any,
        );
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(InvalidPayloadDataError);

        if (error instanceof InvalidPayloadDataError) {
          expect(error.data).toBeDefined();
          expect(error.data).toHaveProperty('email');
          expect(error.data).toHaveProperty('firstName');
          expect(error.data).toHaveProperty('lastName');
          expect(error.data).toHaveProperty('activationToken');
          expect(error.data).toHaveProperty('activationTokenExpirationDate');
        }
      }
    });
  });

  describe(`${UserOutboxEntity.userAccountActivated.name}`, () => {
    const eventType = UserEvents.USER_ACCOUNT_ACTIVATED;

    it(`should create ${eventType} user outbox event`, () => {
      const event = UserOutboxEntity.userAccountActivated(
        userId,
        correlationId,
        {
          email,
          firstName,
          lastName,
        },
      );

      expect(event.userId).toBe(userId);
      expect(event.aggregateId).toBe(userId);
      expect(event.eventType).toBe(eventType);
      expect(event.payload).toMatchObject<UserAccountActivatedPayload>({
        email,
        firstName,
        lastName,
      });
    });

    it(`should create ${eventType} without additional fields in payload`, () => {
      const event = UserOutboxEntity.userAccountActivated(
        userId,
        correlationId,
        {
          email,
          firstName,
          lastName,
          activationToken,
          activationTokenExpirationDate,
        } as any,
      );

      expect(event.userId).toBe(userId);
      expect(event.aggregateId).toBe(userId);
      expect(event.eventType).toBe(eventType);
      expect(event.payload).toMatchObject<UserAccountActivatedPayload>({
        email,
        firstName,
        lastName,
      });
    });

    it(`should throw ${InvalidPayloadDataError.name} for invalid payload`, () => {
      expect(() =>
        UserOutboxEntity.userAccountActivated(userId, correlationId, {} as any),
      ).toThrow(InvalidPayloadDataError);
    });

    it(`should include field errors in ${InvalidPayloadDataError.name}`, () => {
      try {
        UserOutboxEntity.userAccountActivated(userId, correlationId, {} as any);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(InvalidPayloadDataError);

        if (error instanceof InvalidPayloadDataError) {
          expect(error.data).toBeDefined();
          expect(error.data).toHaveProperty('email');
          expect(error.data).toHaveProperty('firstName');
          expect(error.data).toHaveProperty('lastName');
        }
      }
    });
  });

  describe(`${UserOutboxEntity.userAccountRegistrationAttemptedWithExistingAccount.name}`, () => {
    const eventType =
      UserEvents.USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT;

    it(`should create ${eventType} user outbox event`, () => {
      const event =
        UserOutboxEntity.userAccountRegistrationAttemptedWithExistingAccount(
          userId,
          correlationId,
          {
            email,
            firstName,
            lastName,
          },
        );

      expect(event.userId).toBe(userId);
      expect(event.aggregateId).toBe(userId);
      expect(event.eventType).toBe(eventType);
      expect(
        event.payload,
      ).toMatchObject<UserAccountRegistrationAttemptedPayload>({
        email,
        firstName,
        lastName,
      });
    });

    it(`should create ${eventType} without additional fields in payload`, () => {
      const event =
        UserOutboxEntity.userAccountRegistrationAttemptedWithExistingAccount(
          userId,
          correlationId,
          {
            email,
            firstName,
            lastName,
            activationToken,
            activationTokenExpirationDate,
          } as any,
        );

      expect(event.userId).toBe(userId);
      expect(event.aggregateId).toBe(userId);
      expect(event.eventType).toBe(eventType);
      expect(
        event.payload,
      ).toMatchObject<UserAccountRegistrationAttemptedPayload>({
        email,
        firstName,
        lastName,
      });
    });

    it(`should throw ${InvalidPayloadDataError.name} for invalid payload`, () => {
      expect(() =>
        UserOutboxEntity.userAccountRegistrationAttemptedWithExistingAccount(
          userId,
          correlationId,
          {} as any,
        ),
      ).toThrow(InvalidPayloadDataError);
    });

    it(`should include field errors in ${InvalidPayloadDataError.name}`, () => {
      try {
        UserOutboxEntity.userAccountRegistrationAttemptedWithExistingAccount(
          userId,
          correlationId,
          {} as any,
        );
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(InvalidPayloadDataError);

        if (error instanceof InvalidPayloadDataError) {
          expect(error.data).toBeDefined();
          expect(error.data).toHaveProperty('email');
          expect(error.data).toHaveProperty('firstName');
          expect(error.data).toHaveProperty('lastName');
        }
      }
    });
  });
});
