import { Logger, OnModuleInit, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthenticatedUser } from '@domain/auth/types';
import { AppConfig } from '@technical/app-config/app-config';
import { UnauthorizedError } from '@domain/auth/errors/unauthorized.error';
import { parseCookie } from 'cookie';
import { signedCookie } from 'cookie-parser';
import { RedisSub } from '@technical/redis/redis.sub';
import { JwtAuthService } from '@modules/jwt-auth/jwt-auth.service';
import { SyncTimer } from './timer';
import type { AuthenticatedSocket, StatefulSocket } from './types';
import { GatewayAuthGuard } from './gateway-auth.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS,
    credentials: true,
  },
  transports: ['websocket'],
  namespace: 'price-feed',
})
export class PriceEngineGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  private readonly server: Server;
  private subscriptions = new Map<string, Set<string>>();
  private readonly sessionSocketIdMap = new Map<string, string>();
  private readonly logger = new Logger(PriceEngineGateway.name);

  constructor(
    private readonly appConfig: AppConfig,
    private readonly redisSub: RedisSub,
    private readonly jwtAuthService: JwtAuthService,
  ) {}

  async handleConnection(socket: StatefulSocket) {
    try {
      socket.user = await this.authenticate(socket);
      this.subscriptions.set(socket.id, new Set());
      this.sessionSocketIdMap.set(socket.user.sessionId, socket.id);
      socket.timer = SyncTimer.start(30_000, () => {
        socket.emit('keepalive:timeout');
        socket.disconnect(true);
        this.logger.log(`Socket ${socket.id} keepalive timeout`);
      });
      socket.emit('authenticated');
      this.logger.log(
        `Client connected: ${socket.id} (user ${socket.user.userId}) (session ${socket.user.sessionId})`,
      );
    } catch (err) {
      this.logger.warn(`Auth failed for ${socket.id}: ${err.message}`);
      socket.emit('error', { message: 'Authentication failed' });
      socket.disconnect(true);
    }
  }

  handleDisconnect(client: StatefulSocket) {
    client?.timer?.clear();

    this.subscriptions.delete(client.id);
    if (client.user) this.sessionSocketIdMap.delete(client?.user?.sessionId);

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private async authenticate(socket: Socket): Promise<AuthenticatedUser> {
    const raw = socket.handshake.headers.cookie;

    if (!raw) {
      throw new UnauthorizedError();
    }

    const cookies = parseCookie(raw);
    const signedTokenCookie = cookies['access_token'];

    if (!signedTokenCookie) {
      throw new UnauthorizedError();
    }

    try {
      const token = signedCookie(
        signedTokenCookie,
        this.appConfig.values.COOKIE_SECRET,
      );

      if (token == false) throw new UnauthorizedError();

      return this.jwtAuthService.validate(token);
    } catch {
      throw new UnauthorizedError();
    }
  }

  async onModuleInit(): Promise<void> {
    await this.redisSub.psubscribe('feed:*', (err, count) => {
      if (err) {
        this.logger.error(`Failed to psub to feed:*`);
        this.logger.error(err);
      } else {
        this.logger.log('listening on feed:*');
      }
    });

    await this.redisSub.subscribe('auth:session:remove', async (err) => {
      if (err) {
        this.logger.error('Failed to sub on "auth:session:remove"');
      } else {
        this.logger.log(`subscribed to "auth:session:remove"`);
      }
    });

    this.redisSub.on(
      'pmessage',
      async (_pattern: string, channel: string, message: string) => {
        this.broadcast(channel.substring(5), message);
      },
    );

    this.redisSub.on('message', (channel, msg) => {
      if (channel === 'auth:session:remove') {
        const socketId = this.sessionSocketIdMap.get(msg);
        if (socketId) {
          this.server.sockets.sockets.get(socketId)?.disconnect(true);
        }
      }
    });
  }

  private async broadcast(symbol: string, data: string): Promise<void> {
    this.server.to(`price:${symbol}`).emit('price', data);
  }

  @UseGuards(GatewayAuthGuard)
  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { instruments: string[] },
  ) {
    const subs = this.subscriptions.get(client.id) ?? new Set();

    for (const instrument of payload.instruments) {
      const room = `price:${instrument}`;
      client.join(room);
      subs.add(instrument);
    }

    this.subscriptions.set(client.id, subs);
  }

  @UseGuards(GatewayAuthGuard)
  @SubscribeMessage('keepalive')
  async keepAlive(
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    client.timer.restart();
  }
}
