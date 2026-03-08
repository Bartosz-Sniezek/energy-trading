import { Inject, Injectable, Optional } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Hash } from '../users/types';
import { HASHING_SERVICE_SALT_ROUNDS } from './constants';

@Injectable()
export class HashingService {
  constructor(
    @Optional()
    @Inject(HASHING_SERVICE_SALT_ROUNDS)
    private readonly saltRounds: number = 14,
  ) {}

  async hash(password: string): Promise<Hash> {
    return bcrypt.hash(password, this.saltRounds).then((hash) => <Hash>hash);
  }

  async compare(password: string, hash: Hash): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
