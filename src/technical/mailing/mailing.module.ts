import { Module } from '@nestjs/common';
import { MAIL_SERVICE as MAILING_SERVICE } from './constants';
import { AppConfig } from '@technical/app-config/app-config';
import { TransportMode } from './transport-mode.enum';
import { MailService } from './interfaces/mail-service';
import { ConsoleMailService } from './console-mail.service';
import { NodemailerMailService } from './nodemailer-mail.service';
import { AppConfigModule } from '@technical/app-config/app-config.module';

@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: MAILING_SERVICE,
      useFactory: (appConfig: AppConfig): MailService => {
        const mode = appConfig.values.MAILER_TRANSPORT_MODE;
        switch (appConfig.values.MAILER_TRANSPORT_MODE) {
          case TransportMode.CONSOLE:
            return new ConsoleMailService();
          case TransportMode.SMTP:
            return new NodemailerMailService(appConfig);
          default:
            throw new Error(`Unsupported transport: ${mode}`);
        }
      },
      inject: [AppConfig],
    },
  ],
  exports: [MAILING_SERVICE],
})
export class MailingModule {}
