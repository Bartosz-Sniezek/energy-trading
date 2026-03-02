import { UserEntity } from '@modules/users/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '@technical/app-config/app-config';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { AccessToken, AccessTokenPayload, RefreshToken } from '../types';
import { RefreshTokenEntity } from '@domain/auth/entities/refresh-token.entity';
import { randomBytes, randomUUID } from 'crypto';
import { UserId } from '@modules/users/types';
import { AppCacheService } from '@technical/cache/app-cache.service';

@Injectable()
export class TokenService {
  private readonly blacklistTTL: number;
  constructor(
    private readonly appConfig: AppConfig,
    private readonly jwtService: JwtService,
    private readonly datetimeService: DatetimeService,
    private readonly cacheService: AppCacheService,
  ) {
    this.blacklistTTL =
      appConfig.values.JWT_REFRESH_TOKEN_EXPIRATION_SEC * 1000;
  }

  private composeBlacklistKey(userId: UserId, sessionId: string): string {
    return `blacklist:${userId}:${sessionId}`;
  }

  async blacklist(userId: UserId, sessionId: string): Promise<void> {
    await this.cacheService.set(
      this.composeBlacklistKey(userId, sessionId),
      '1',
      this.blacklistTTL,
    );
  }

  async isBlacklisted(userId: UserId, sessionId: string): Promise<boolean> {
    return this.cacheService
      .get(this.composeBlacklistKey(userId, sessionId))
      .then((v) => v != null);
  }

  async generateAccessToken(
    user: UserEntity,
    sessionId: string,
  ): Promise<AccessToken> {
    const sub = user.id;
    const email = user.email;
    const iat = this.datetimeService.nowInSeconds();
    const exp = iat + this.appConfig.values.JWT_ACCESS_TOKEN_EXPIRATION_SEC;

    return this.jwtService
      .signAsync(
        <AccessTokenPayload>{
          sub,
          email,
          iat,
          jti: randomUUID(),
          sid: sessionId,
          exp,
        },
        {
          privateKey: this.appConfig.values.JWT_ACCESS_TOKEN_SECRET,
        },
      )
      .then((token) => <AccessToken>token);
  }

  createRefreshToken(user: UserEntity, family?: string): RefreshTokenEntity {
    const token = randomBytes(64).toString('hex');
    const createdAt = this.datetimeService.new();
    const expiresAt = this.datetimeService.addSeconds(
      createdAt,
      this.appConfig.values.JWT_REFRESH_TOKEN_EXPIRATION_SEC,
    );
    const tokenFamily = family ?? randomUUID();

    return RefreshTokenEntity.create({
      userId: user.id,
      token: <RefreshToken>token,
      family: tokenFamily,
      createdAt,
      expiresAt,
    });
  }
}
