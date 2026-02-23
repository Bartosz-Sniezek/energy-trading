import { Injectable, Logger } from '@nestjs/common';
import { MailService, SendMailOptions } from './interfaces/mail-service';

@Injectable()
export class ConsoleMailService implements MailService {
  private readonly logger = new Logger(ConsoleMailService.name);

  // eslint-disable-next-line @typescript-eslint/require-await
  async send(options: SendMailOptions): Promise<void> {
    this.logger.log(options);
  }
}
