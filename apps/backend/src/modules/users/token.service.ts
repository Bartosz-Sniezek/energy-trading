import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class TokensService {
  generateToken(): string {
    return randomBytes(64).toString('hex');
  }
}
