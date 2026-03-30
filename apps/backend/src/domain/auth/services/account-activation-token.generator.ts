import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class AccountActivationTokenGenerator {
  generate(): string {
    return randomBytes(64).toString('hex');
  }
}
