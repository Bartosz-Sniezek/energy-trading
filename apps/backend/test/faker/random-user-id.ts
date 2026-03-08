import { UserId } from '@modules/users/types';
import { v7 } from 'uuid';

export const randomUserId = (): UserId => {
  return v7() as UserId;
};
