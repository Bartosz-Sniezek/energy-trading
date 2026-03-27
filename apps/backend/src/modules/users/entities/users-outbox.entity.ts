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

@Entity('users_outbox')
export class UserOutboxEntity extends OutboxEntity<
  UserEvents,
  UserOutboxPayload
> {
  private static createOutboxEvent(
    userId: UserId,
    correlationId: string,
    eventType: UserEvents,
    schema: z.ZodType,
    payload: unknown,
  ): UserOutboxEntity {
    return Object.assign(new UserOutboxEntity(), {
      aggregateId: userId,
      userId,
      correlationId,
      eventType,
      payload: UserOutboxEntity.parsePayload(schema, payload),
    });
  }

  static userAccountRegistered(
    userId: UserId,
    correlationId: string,
    payload: UserAccountCreatedPayload,
  ): UserOutboxEntity {
    return UserOutboxEntity.createOutboxEvent(
      userId,
      correlationId,
      UserEvents.USER_ACCOUNT_REGISTERED,
      userAccountCreatedPayloadSchema,
      payload,
    );
  }

  static userAccountActivated(
    userId: UserId,
    correlationId: string,
    payload: UserAccountActivatedPayload,
  ): UserOutboxEntity {
    return UserOutboxEntity.createOutboxEvent(
      userId,
      correlationId,
      UserEvents.USER_ACCOUNT_ACTIVATED,
      userAccountActivatedPayloadSchema,
      payload,
    );
  }

  static userAccountRegistrationAttemptedWithExistingAccount(
    userId: UserId,
    correlationId: string,
    payload: UserAccountRegistrationAttemptedPayload,
  ): UserOutboxEntity {
    return UserOutboxEntity.createOutboxEvent(
      userId,
      correlationId,
      UserEvents.USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT,
      userAccountRegistrationAttemptedPayloadSchema,
      payload,
    );
  }

  static activationTokenResendRequested(
    userId: UserId,
    correlationId: string,
    payload: ActivationTokenResendRequestedPayload,
  ): UserOutboxEntity {
    return UserOutboxEntity.createOutboxEvent(
      userId,
      correlationId,
      UserEvents.ACTIVATION_TOKEN_RESEND_REQUESTED,
      activationTokenResendRequestedPayloadSchema,
      payload,
    );
  }
}
