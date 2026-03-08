import { randomBytes } from 'crypto';

export const randomToken = (): string => {
  return randomBytes(64).toString('hex');
};
