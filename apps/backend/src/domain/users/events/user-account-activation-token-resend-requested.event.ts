import z from 'zod';
import { DebeziumOutboxMessage } from '../../../common/kafka/debezium-connector-message.parser';
import { InvalidPayloadDataError } from '@common/errors/invalid-payload-data.error';
import { Email } from '@domain/users/value-objects/email';
import { UserEvents } from '@domain/users/events.enum';
import { InvalidEventTypeError } from '@common/errors/invalid-event-type.error';

export const userAccountActivationTokenResendRequestedEventSchema = z.object({
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

export type TUserAccountActivationTokenResendRequestedEventEvent = z.infer<
  typeof userAccountActivationTokenResendRequestedEventSchema
>;

export class UserAccountActivationTokenResendRequestedEvent implements TUserAccountActivationTokenResendRequestedEventEvent {
  readonly __type: UserEvents.ACTIVATION_TOKEN_RESEND_REQUESTED;
  readonly id: string;
  readonly userId: string;
  readonly email: Email;
  readonly firstName: string;
  readonly lastName: string;
  readonly activationToken: string;
  readonly activationTokenExpirationDate: Date;
  readonly timestamp: number;

  private constructor(
    options: TUserAccountActivationTokenResendRequestedEventEvent,
  ) {
    Object.assign(this, options);
  }

  static parse(
    event: DebeziumOutboxMessage,
  ): UserAccountActivationTokenResendRequestedEvent {
    if (
      event.eventType !==
      UserEvents.ACTIVATION_TOKEN_RESEND_REQUESTED.toString()
    ) {
      throw new InvalidEventTypeError(event.eventType);
    }

    const payload = event.payload;
    const { data, error } =
      userAccountActivationTokenResendRequestedEventSchema.safeParse({
        id: event.id,
        userId: event.userId,
        email: payload?.['email'],
        firstName: payload?.['firstName'],
        lastName: payload?.['lastName'],
        activationToken: payload?.['activationToken'],
        activationTokenExpirationDate:
          payload?.['activationTokenExpirationDate'],
        timestamp: event.timestamp,
      });

    if (error) throw new InvalidPayloadDataError(error.flatten().fieldErrors);

    return new UserAccountActivationTokenResendRequestedEvent(data);
  }
}
