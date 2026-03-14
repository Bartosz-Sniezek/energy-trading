import { UserEvents } from '@domain/users/events.enum';
import { OutboxEntity } from '@common/abstract/outbox.entity';
import { Entity } from 'typeorm';
import { UserId } from '../types';
import {
  ActivationTokenResendRequestedPayload,
  activationTokenResendRequestedPayloadSchema,
  UserAccountActivatedPayload,
  userAccountActivatedPayloadSchema,
  UserAccountCreatedPayload,
  userAccountCreatedPayloadSchema,
  UserAccountRegistrationAttemptedPayload,
  userAccountRegistrationAttemptedPayloadSchema,
  UserOutboxPayload,
} from './schemas/outbox-payload.schema';
import z from 'zod';
import { InvalidPayloadDataError } from '../../../common/errors/invalid-payload-data.error';

@Entity('users_outbox')
export class UserOutboxEntity extends OutboxEntity<
  UserEvents,
  UserOutboxPayload
> {
  private static createOutboxEvent(
    userId: UserId,
    eventType: UserEvents,
    schema: z.ZodType,
    payload: unknown,
  ): UserOutboxEntity {
    return Object.assign(new UserOutboxEntity(), {
      aggregateId: userId,
      eventType,
      payload: UserOutboxEntity.parsePayload(schema, payload),
    });
  }

  private static parsePayload<T extends z.ZodType>(
    schema: T,
    payloadData: unknown,
  ): z.infer<T> {
    const { success, data, error } = schema.safeParse(payloadData);

    if (!success) {
      throw new InvalidPayloadDataError(error.flatten().fieldErrors);
    }

    return data;
  }

  static userAccountRegistered(
    userId: UserId,
    payload: UserAccountCreatedPayload,
  ): UserOutboxEntity {
    return UserOutboxEntity.createOutboxEvent(
      userId,
      UserEvents.USER_ACCOUNT_REGISTERED,
      userAccountCreatedPayloadSchema,
      payload,
    );
  }

  static userAccountActivated(
    userId: UserId,
    payload: UserAccountActivatedPayload,
  ): UserOutboxEntity {
    return UserOutboxEntity.createOutboxEvent(
      userId,
      UserEvents.USER_ACCOUNT_ACTIVATED,
      userAccountActivatedPayloadSchema,
      payload,
    );
  }

  static userAccountRegistrationAttemptedWithExistingAccount(
    userId: UserId,
    payload: UserAccountRegistrationAttemptedPayload,
  ): UserOutboxEntity {
    return UserOutboxEntity.createOutboxEvent(
      userId,
      UserEvents.USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT,
      userAccountRegistrationAttemptedPayloadSchema,
      payload,
    );
  }

  static activationTokenResendRequested(
    userId: UserId,
    payload: ActivationTokenResendRequestedPayload,
  ): UserOutboxEntity {
    return UserOutboxEntity.createOutboxEvent(
      userId,
      UserEvents.ACTIVATION_TOKEN_RESEND_REQUESTED,
      activationTokenResendRequestedPayloadSchema,
      payload,
    );
  }
}
