import { v7 } from 'uuid';
import { DebeziumOutboxMessage } from '../debezium-connector-message.parser';
import { UserAccountRegistrationAttemptedWithExistingAccountEvent } from './user-account-registration-attempted-with-existing-accounter.event';
import { randomEmail } from 'test/faker/random-email';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomLastName } from 'test/faker/random-last-name';
import { UserEvents } from '@domain/users/events.enum';
import { InvalidPayloadDataError } from '@common/errors/invalid-payload-data.error';
import { InvalidEventTypeError } from '@common/errors/invalid-event-type.error';
import { randomCorrelationId } from 'test/faker/random-correlation-id';
import { randomUserId } from 'test/faker/random-user-id';

describe(UserAccountRegistrationAttemptedWithExistingAccountEvent.name, () => {
  const email = randomEmail();
  const firstName = randomFirstName();
  const lastName = randomLastName();
  const timestamp = Date.now().toString();

  const validEventPayload = {
    email: email.getValue(),
    firstName,
    lastName,
  };
  const validEventData: DebeziumOutboxMessage = {
    id: v7(),
    userId: randomUserId(),
    correlationId: randomCorrelationId(),
    aggregateId: v7(),
    eventType:
      UserEvents.USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT,
    timestamp,
    payload: validEventPayload,
  };

  describe(
    UserAccountRegistrationAttemptedWithExistingAccountEvent.parse.name,
    () => {
      it(`should create an event from DebeziumOutboxMessage`, () => {
        const event =
          UserAccountRegistrationAttemptedWithExistingAccountEvent.parse(
            validEventData,
          );

        expect(event.id).toBe(validEventData.id);
        expect(event.userId).toBe(validEventData.userId);
        expect(event.email.getValue()).toBe(email.getValue());
        expect(event.firstName).toBe(firstName);
        expect(event.lastName).toBe(lastName);
        expect(event.timestamp).toBe(parseInt(timestamp));
      });

      it(`should throw InvalidPayloadData when id is non-uuid string`, () => {
        expect(() =>
          UserAccountRegistrationAttemptedWithExistingAccountEvent.parse({
            ...validEventData,
            id: 'invalid-uuid',
          }),
        ).toThrow(InvalidPayloadDataError);
      });

      it(`should throw InvalidPayloadData when id UUIDv4`, () => {
        expect(() =>
          UserAccountRegistrationAttemptedWithExistingAccountEvent.parse({
            ...validEventData,
            id: '92b8e7b4-6a6b-40a1-a450-cf2f2c4a44a8',
          }),
        ).toThrow(InvalidPayloadDataError);
      });

      it(`should throw InvalidPayloadData when userId is non-uuid string`, () => {
        expect(() =>
          UserAccountRegistrationAttemptedWithExistingAccountEvent.parse({
            ...validEventData,
            userId: 'invalid-uuid',
          }),
        ).toThrow(InvalidPayloadDataError);
      });

      it(`should throw InvalidPayloadData when userId is UUIDv4`, () => {
        expect(() =>
          UserAccountRegistrationAttemptedWithExistingAccountEvent.parse({
            ...validEventData,
            userId: '92b8e7b4-6a6b-40a1-a450-cf2f2c4a44a8',
          }),
        ).toThrow(InvalidPayloadDataError);
      });

      it(`should throw InvalidEventTypeError when eventType is not ${UserEvents.USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT}`, () => {
        expect(() =>
          UserAccountRegistrationAttemptedWithExistingAccountEvent.parse({
            ...validEventData,
            eventType: 'random-string',
          }),
        ).toThrow(InvalidEventTypeError);
        expect(() =>
          UserAccountRegistrationAttemptedWithExistingAccountEvent.parse({
            ...validEventData,
            eventType: UserEvents.USER_ACCOUNT_ACTIVATED,
          }),
        ).toThrow(InvalidEventTypeError);
        expect(() =>
          UserAccountRegistrationAttemptedWithExistingAccountEvent.parse({
            ...validEventData,
            eventType: UserEvents.USER_ACCOUNT_REGISTERED,
          }),
        ).toThrow(InvalidEventTypeError);
      });

      it(`should throw InvalidPayloadData when email is not valid email`, () => {
        expect(() =>
          UserAccountRegistrationAttemptedWithExistingAccountEvent.parse({
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
          UserAccountRegistrationAttemptedWithExistingAccountEvent.parse({
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
          UserAccountRegistrationAttemptedWithExistingAccountEvent.parse({
            ...validEventData,
            payload: {
              ...validEventPayload,
              lastName: 12,
            },
          }),
        ).toThrow(InvalidPayloadDataError);
      });

      it(`should throw InvalidPayloadData when timestamp is not a string`, () => {
        expect(() =>
          UserAccountRegistrationAttemptedWithExistingAccountEvent.parse({
            ...validEventData,
            timestamp: undefined as any,
          }),
        ).toThrow(InvalidPayloadDataError);
      });
    },
  );
});
