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
    KAFKA_USERS_OUTBOX_TOPIC: z.string(),
    MAILER_FROM: z.string(),
    MAILER_TRANSPORT_MODE: z.enum(TransportMode),
    MAILER_SMTP_HOST: z.string().optional(),
    MAILER_SMTP_PORT: z.coerce.number().optional(),
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
}
