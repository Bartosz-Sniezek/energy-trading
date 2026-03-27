import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransportMode } from '@technical/mailing/transport-mode.enum';
import z from 'zod';

const refineMailerTransportMode = (
  data: AppEnvConfig,
  ctx: z.core.ParsePayload<AppEnvConfig>,
) => {
  if (data.MAILER_TRANSPORT_MODE === TransportMode.SMTP) {
    if (!ctx.value.MAILER_SMTP_HOST) {
      ctx.issues.push({
        input: data.MAILER_SMTP_HOST,
        code: 'custom',
        message: 'MAILER_SMTP_HOST is required with MAILER_TRANSPORT_MODE=smtp',
        path: ['MAILER_SMTP_HOST'],
      });
    }

    if (!data.MAILER_SMTP_PORT) {
      ctx.issues.push({
        input: data.MAILER_SMTP_PORT,
        code: 'custom',
        message: 'MAILER_SMTP_PORT is required with MAILER_TRANSPORT_MODE=smtp',
        path: ['MAILER_SMTP_PORT'],
      });
    }
  }
};

const appConfigSchema = z
  .object({
    NODE_ENV: z.string(),
    PORT: z.coerce.number().default(8000),
    DATABASE_URL: z.string(),
    KAFKA_BROKER: z.string(),
    KAFKA_LOG_LEVEL: z.coerce.number().optional(),
    KAFKA_USERS_OUTBOX_TOPIC: z.string(),
    KAFKA_USERS_OUTBOX_TOPIC_DLQ: z.string(),
    EMAIL_NOTIFIER_CONSUMER_GROUP_ID: z.string(),
    EMAIL_NOTIFIER_CONSUMER_RETRY_BASE_DELAY: z.coerce.number().min(50),
    EMAIL_NOTIFIER_CONSUMER_MAX_RETRIES: z.coerce.number().nonnegative(),
    JWT_ACCESS_TOKEN_SECRET: z.string(),
    JWT_ACCESS_TOKEN_EXPIRATION_SEC: z.coerce.number().positive(),
    JWT_REFRESH_TOKEN_EXPIRATION_SEC: z.coerce.number().positive(),
    COOKIE_SECRET: z.string(),
    MAILER_FROM: z.string(),
    MAILER_TRANSPORT_MODE: z.enum(TransportMode),
    MAILER_SMTP_HOST: z.string().optional(),
    MAILER_SMTP_PORT: z.coerce.number().optional(),
    REDIS_URL: z.string(),
    ACCOUNT_ACTIVATION_RESEND_TOKEN_TTL_SECONDS: z.coerce
      .number()
      .positive()
      .min(60),
    ALLOWED_ORIGINS: z.string(),
    FRONTEND_BASE_URL: z.string(),
    COMPANY_NAME: z.string(),
    PRICE_ENGINE_TICK_TOPIC: z.string(),
    PRICE_ENGINE_TICK_INTERVAL_MS: z.coerce.number().int().positive(),
    KAFKA_LEDGER_OUTBOX_TOPIC: z.string(),
  })
  .superRefine((data, ctx) => {
    refineMailerTransportMode(data, ctx);
  });

export type AppEnvConfig = z.infer<typeof appConfigSchema>;

const schemaKeys = Object.keys(appConfigSchema.shape) as Array<
  keyof AppEnvConfig
>;

type SMTPConfig = {
  host: string;
  port: number;
};

@Injectable()
export class AppConfig {
  private readonly _values: AppEnvConfig;

  constructor(configService: ConfigService) {
    this._values = appConfigSchema.parse(
      Object.fromEntries(
        schemaKeys.map((key) => [key, configService.get(key)]),
      ),
    );
  }

  get values(): AppEnvConfig {
    return { ...this._values };
  }

  get smtpConfig(): SMTPConfig {
    if (!this._values.MAILER_SMTP_HOST)
      throw new Error('MAILER_SMTP_HOST is not set');
    if (!this._values.MAILER_SMTP_PORT)
      throw new Error('MAILER_SMTP_PORT is not set');

    return {
      host: this._values.MAILER_SMTP_HOST,
      port: this._values.MAILER_SMTP_PORT,
    };
  }

  get allowedOrigins(): string[] {
    return this._values.ALLOWED_ORIGINS.split(',');
  }

  isProduction(): boolean {
    return this._values.NODE_ENV === 'production';
  }

  get tickConfig() {
    return {
      tickTopic: this._values.PRICE_ENGINE_TICK_TOPIC,
      tickInterval: this._values.PRICE_ENGINE_TICK_INTERVAL_MS,
    };
  }

  get balanceLedgerConsumerConfig() {
    return {
      topic: this._values.KAFKA_LEDGER_OUTBOX_TOPIC,
      logLevel: this._values.KAFKA_LOG_LEVEL,
    };
  }
}
