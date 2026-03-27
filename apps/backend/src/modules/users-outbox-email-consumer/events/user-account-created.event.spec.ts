import { v7 } from 'uuid';
import { DebeziumOutboxMessage } from '../debezium-connector-message.parser';
import { UserAccountCreatedEvent } from './user-account-created.event';
import { randomEmail } from 'test/faker/random-email';
import { randomToken } from 'test/faker/random-token';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { UserEvents } from '@domain/users/events.enum';
import { InvalidPayloadDataError } from '@common/errors/invalid-payload-data.error';
import { InvalidEventTypeError } from '@common/errors/invalid-event-type.error';
import { randomCorrelationId } from 'test/faker/random-correlation-id';
import { randomUserId } from 'test/faker/random-user-id';

describe(UserAccountCreatedEvent.name, () => {
  const email = randomEmail();
  const firstName = randomFirstName();
  const lastName = randomLastName();
  const activationToken = randomToken();
  const activationTokenExpirationDate = new Date().toISOString();
  const timestamp = Date.now().toString();

  const validEventPayload = {
    email: email.getValue(),
    firstName,
    lastName,
    activationToken,
    activationTokenExpirationDate,
  };
  const validEventData: DebeziumOutboxMessage = {
    id: v7(),
    userId: randomUserId(),
    correlationId: randomCorrelationId(),
    aggregateId: v7(),
    eventType: UserEvents.USER_ACCOUNT_REGISTERED,
    timestamp,
    payload: validEventPayload,
  };

  describe(UserAccountCreatedEvent.parse.name, () => {
    it(`should create an event from DebeziumOutboxMessage`, () => {
      const event = UserAccountCreatedEvent.parse(validEventData);

      expect(event.id).toBe(validEventData.id);
      expect(event.userId).toBe(validEventData.userId);
      expect(event.email.getValue()).toBe(email.getValue());
      expect(event.firstName).toBe(firstName);
      expect(event.lastName).toBe(lastName);
      expect(event.activationToken).toBe(activationToken);
      expect(event.activationTokenExpirationDate.toISOString()).toBe(
        activationTokenExpirationDate,
      );
      expect(event.timestamp).toBe(parseInt(timestamp));
    });

    it(`should throw InvalidPayloadData when id is non-uuid string`, () => {
      expect(() =>
        UserAccountCreatedEvent.parse({
          ...validEventData,
          id: 'invalid-uuid',
        }),
      ).toThrow(InvalidPayloadDataError);
    });

    it(`should throw InvalidPayloadData when id UUIDv4`, () => {
      expect(() =>
        UserAccountCreatedEvent.parse({
          ...validEventData,
          id: '92b8e7b4-6a6b-40a1-a450-cf2f2c4a44a8',
        }),
      ).toThrow(InvalidPayloadDataError);
    });

    it(`should throw InvalidPayloadData when userId is non-uuid string`, () => {
      expect(() =>
        UserAccountCreatedEvent.parse({
          ...validEventData,
          userId: 'invalid-uuid',
        }),
      ).toThrow(InvalidPayloadDataError);
    });

    it(`should throw InvalidPayloadData when userId is UUIDv4`, () => {
      expect(() =>
        UserAccountCreatedEvent.parse({
          ...validEventData,
          userId: '92b8e7b4-6a6b-40a1-a450-cf2f2c4a44a8',
        }),
      ).toThrow(InvalidPayloadDataError);
    });

    it(`should throw InvalidEventTypeError when eventType is not ${UserEvents.USER_ACCOUNT_REGISTERED}`, () => {
      expect(() =>
        UserAccountCreatedEvent.parse({
          ...validEventData,
          eventType: 'random-string',
        }),
      ).toThrow(InvalidEventTypeError);
      expect(() =>
        UserAccountCreatedEvent.parse({
          ...validEventData,
          eventType: UserEvents.USER_ACCOUNT_ACTIVATED,
        }),
      ).toThrow(InvalidEventTypeError);
      expect(() =>
        UserAccountCreatedEvent.parse({
          ...validEventData,
          eventType:
            UserEvents.USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT,
        }),
      ).toThrow(InvalidEventTypeError);
    });

    it(`should throw InvalidPayloadData when email is not valid email`, () => {
      expect(() =>
        UserAccountCreatedEvent.parse({
          ...validEventData,
          payload: {
            ...validEventPayload,
            email: 'invalid',
          },
        }),
      ).toThrow(InvalidPayloadDataError);
    });

    it(`should throw InvalidPayloadData when firstName is not a string`, () => {
      expect(() =>
        UserAccountCreatedEvent.parse({
          ...validEventData,
          payload: {
            ...validEventPayload,
            firstName: 12,
          },
        }),
      ).toThrow(InvalidPayloadDataError);
    });

    it(`should throw InvalidPayloadData when lastName is not a string`, () => {
      expect(() =>
        UserAccountCreatedEvent.parse({
          ...validEventData,
          payload: {
            ...validEventPayload,
            lastName: 12,
          },
        }),
      ).toThrow(InvalidPayloadDataError);
    });

    it(`should throw InvalidPayloadData when activationToken is not a string`, () => {
      expect(() =>
        UserAccountCreatedEvent.parse({
          ...validEventData,
          payload: {
            ...validEventPayload,
            activationToken: 12,
          },
        }),
      ).toThrow(InvalidPayloadDataError);
    });

    it(`should throw InvalidPayloadData when activationTokenExpirationDate is not an iso datetime string`, () => {
      expect(() =>
        UserAccountCreatedEvent.parse({
          ...validEventData,
          payload: {
            ...validEventPayload,
            activationTokenExpirationDate: 'random-string',
          },
        }),
      ).toThrow(InvalidPayloadDataError);
      expect(() =>
        UserAccountCreatedEvent.parse({
          ...validEventData,
          payload: {
            ...validEventPayload,
            activationTokenExpirationDate: 1231,
          },
        }),
      ).toThrow(InvalidPayloadDataError);
      expect(() =>
        UserAccountCreatedEvent.parse({
          ...validEventData,
          payload: {
            ...validEventPayload,
            activationTokenExpirationDate: new Date(),
          },
        }),
      ).toThrow(InvalidPayloadDataError);
    });

    it(`should throw InvalidPayloadData when timestamp is not a string`, () => {
      expect(() =>
        UserAccountCreatedEvent.parse({
          ...validEventData,
          timestamp: undefined as any,
        }),
      ).toThrow(InvalidPayloadDataError);
    });
  });
});
