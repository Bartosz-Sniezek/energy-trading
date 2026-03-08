import { Injectable } from '@nestjs/common';
import {
  MailService,
  SendMailOptions,
} from '@technical/mailing/interfaces/mail-service';

@Injectable()
export class MockMailer implements MailService {
  public messageQ: SendMailOptions[] = [];

  send(options: SendMailOptions): Promise<void> {
    this.messageQ.push(options);

    return Promise.resolve();
  }
}
