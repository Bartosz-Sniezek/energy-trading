import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { StatefulSocket } from './types';
import { SessionAuthBridge } from '@domain/auth/services/session-auth.bridge';
import { UnauthorizedError } from '@domain/auth/errors/unauthorized.error';

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  private readonly logger: Logger;

  constructor(
    private readonly sessionAuthBridge: SessionAuthBridge,
    @Optional()
    logger?: Logger,
  ) {
    this.logger = logger ? logger : new Logger(GatewayAuthGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket = context.switchToWs().getClient<StatefulSocket>();

    try {
      if (socket.user == null) {
        this.logger.error('user object is not set on socket instance');
        throw new UnauthorizedError();
      }

      if (socket.timer == null) {
        this.logger.error('timer is not set on socket instance');
        throw new UnauthorizedError();
      }

      const sessionExists = await this.sessionAuthBridge.sessionExists(
        socket.user.sessionId,
      );

      if (sessionExists) return true;

      throw new UnauthorizedError();
    } catch {
      socket.emit('unauthorized');
      socket.disconnect(true);

      throw new UnauthorizedError();
    }
  }
}
