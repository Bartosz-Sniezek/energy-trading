import { RefreshToken } from '@domain/auth/types';
import { randomBytes } from 'crypto';

export const randomRefreshToken = (): RefreshToken => {
  return randomBytes(12).toString('hex') as RefreshToken;
};
