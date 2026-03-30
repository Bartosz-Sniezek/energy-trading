import { Hash } from '@domain/users/types';
import { randomBytes } from 'crypto';

export const randomHash = (): Hash => {
  return randomBytes(12).toString('hex') as Hash;
};
