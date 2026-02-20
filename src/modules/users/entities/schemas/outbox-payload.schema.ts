import z from 'zod';

const userOutboxBasePayloadSchema = z.object({
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
});

export const userAccountCreatedPayloadSchema = userOutboxBasePayloadSchema.extend({
  activationToken: z.string(),
  activationTokenExpirationDate: z.string().datetime(),
});

export const userAccountActivatedPayloadSchema = userOutboxBasePayloadSchema;

export const userAccountRegistrationAttemptedPayloadSchema =
  userOutboxBasePayloadSchema;

export type UserAccountCreatedPayload = z.infer<
  typeof userAccountCreatedPayloadSchema
>;
export type UserAccountActivatedPayload = z.infer<
  typeof userAccountActivatedPayloadSchema
>;
export type UserAccountRegistrationAttemptedPayload = z.infer<
  typeof userAccountRegistrationAttemptedPayloadSchema
>;

export type UserOutboxPayload =
  | UserAccountCreatedPayload
  | UserAccountActivatedPayload
  | UserAccountRegistrationAttemptedPayload;
