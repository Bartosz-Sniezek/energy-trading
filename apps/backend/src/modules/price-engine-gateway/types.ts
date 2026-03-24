import { AuthenticatedUser } from '@domain/auth/types';
import { SyncTimer } from './timer';
import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  user: AuthenticatedUser;
  timer: SyncTimer;
}

export interface StatefulSocket extends Socket {
  user?: AuthenticatedUser;
  timer?: SyncTimer;
}
