import z from 'zod';
import { DebeziumOutboxMessage } from '../debezium-connector-message.parser';
import { InvalidPayloadDataError } from '@common/errors/invalid-payload-data.error';
import { Email } from '@domain/users/value-objects/email';
import { UserEvents } from '@domain/users/events.enum';
import { InvalidEventTypeError } from '@common/errors/invalid-event-type.error';

export const userAccountRegistrationAttemptedWithExistingAccountEventSchema =
  z.object({
    id: z.uuidv7(),
    userId: z.uuidv7(),
    email: z.email().transform((data) => Email.create(data)),
    firstName: z.string(),
    lastName: z.string(),
    timestamp: z.string().transform((data) => parseInt(data)),
  });

export type TUserAccountRegistrationAttemptedWithExistingAccountEvent = z.infer<
  typeof userAccountRegistrationAttemptedWithExistingAccountEventSchema
>;

export class UserAccountRegistrationAttemptedWithExistingAccountEvent implements TUserAccountRegistrationAttemptedWithExistingAccountEvent {
  readonly __type: UserEvents.USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT;
  readonly id: string;
  readonly userId: string;
  readonly email: Email;
  readonly firstName: string;
  readonly lastName: string;
  readonly timestamp: number;

  private constructor(
    options: TUserAccountRegistrationAttemptedWithExistingAccountEvent,
  ) {
    Object.assign(this, options);
  }

  static parse(
    event: DebeziumOutboxMessage,
  ): UserAccountRegistrationAttemptedWithExistingAccountEvent {
    if (
      event.eventType !==
      UserEvents.USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT.toString()
    ) {
      throw new InvalidEventTypeError(event.eventType);
    }

    const payload = event.payload;
    const { data, error } =
      userAccountRegistrationAttemptedWithExistingAccountEventSchema.safeParse({
        id: event.id,
        userId: event.userId,
        email: payload?.['email'],
        firstName: payload?.['firstName'],
        lastName: payload?.['lastName'],
        timestamp: event.timestamp,
      });

    if (error) throw new InvalidPayloadDataError(error.flatten().fieldErrors);

    return new UserAccountRegistrationAttemptedWithExistingAccountEvent(data);
  }
}
