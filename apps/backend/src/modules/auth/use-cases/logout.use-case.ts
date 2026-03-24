import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RefreshTokenEntity } from '@domain/auth/entities/refresh-token.entity';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { TokenService } from '@domain/auth/services/token.service';
import { UserId } from '@modules/users/types';
import { SessionAuthBridge } from '@domain/auth/services/session-auth.bridge';

@Injectable()
export class LogoutUseCase {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    private readonly datetimeService: DatetimeService,
    private readonly tokenService: TokenService,
    private readonly sessionAuthBridge: SessionAuthBridge,
  ) {}

  async execute(userId: UserId, sessionId: string): Promise<void> {
    const isSessionBlacklisted = await this.tokenService.isSessionBlacklisted(
      userId,
      sessionId,
    );

    if (isSessionBlacklisted) return;

    await this.refreshTokenRepository.update(
      {
        userId,
        family: sessionId,
        revokedAt: IsNull(),
      },
      {
        revokedAt: this.datetimeService.new(),
      },
    );

    await this.tokenService.blacklistSession(userId, sessionId);
    await this.sessionAuthBridge.removeSessionFromCache(sessionId);

    return;
  }
}
