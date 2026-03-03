import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RefreshTokenEntity } from '@domain/auth/entities/refresh-token.entity';
import { AuthenticatedUser } from '@domain/auth/types';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { TokenService } from '@domain/auth/services/token.service';

@Injectable()
export class LogoutUseCase {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    private readonly datetimeService: DatetimeService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(user: AuthenticatedUser): Promise<void> {
    const isSessionBlacklisted = await this.tokenService.isSessionBlacklisted(
      user.userId,
      user.sessionId,
    );

    if (isSessionBlacklisted) return;

    await this.refreshTokenRepository.update(
      {
        userId: user.userId,
        family: user.sessionId,
        revokedAt: IsNull(),
      },
      {
        revokedAt: this.datetimeService.new(),
      },
    );

    await this.tokenService.blacklistSession(user.userId, user.sessionId);

    return;
  }
}
