import z from 'zod';
import { DebeziumOutboxMessage } from '../debezium-connector-message.parser';
import { InvalidPayloadDataError } from '@common/errors/invalid-payload-data.error';
import { Email } from '@domain/users/value-objects/email';
import { UserEvents } from '@domain/users/events.enum';
import { InvalidEventTypeError } from '@common/errors/invalid-event-type.error';

export const userAccountCreatedEventSchema = z.object({
  id: z.uuidv7(),
  userId: z.uuidv7(),
  email: z.email().transform((data) => Email.create(data)),
  firstName: z.string(),
  lastName: z.string(),
  activationToken: z.string(),
  activationTokenExpirationDate: z.iso
    .datetime()
    .transform((date) => new Date(date)),
  timestamp: z.string().transform((data) => parseInt(data)),
});

export type TUserAccountCreatedEvent = z.infer<
  typeof userAccountCreatedEventSchema
>;

export class UserAccountCreatedEvent implements TUserAccountCreatedEvent {
  readonly __type: UserEvents.USER_ACCOUNT_REGISTERED;
  readonly id: string;
  readonly userId: string;
  readonly email: Email;
  readonly firstName: string;
  readonly lastName: string;
  readonly activationToken: string;
  readonly activationTokenExpirationDate: Date;
  readonly timestamp: number;

  private constructor(options: TUserAccountCreatedEvent) {
    Object.assign(this, options);
  }

  static parse(event: DebeziumOutboxMessage): UserAccountCreatedEvent {
    if (event.eventType !== UserEvents.USER_ACCOUNT_REGISTERED.toString()) {
      throw new InvalidEventTypeError(event.eventType);
    }

    const payload = event.payload;
    const { data, error } = userAccountCreatedEventSchema.safeParse({
      id: event.id,
      userId: event.userId,
      email: payload?.['email'],
      firstName: payload?.['firstName'],
      lastName: payload?.['lastName'],
      activationToken: payload?.['activationToken'],
      activationTokenExpirationDate: payload?.['activationTokenExpirationDate'],
      timestamp: event.timestamp,
    });

    if (error) throw new InvalidPayloadDataError(error.flatten().fieldErrors);

    return new UserAccountCreatedEvent(data);
  }
}
