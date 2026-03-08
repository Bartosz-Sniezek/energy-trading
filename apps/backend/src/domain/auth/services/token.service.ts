import { UserEntity } from '@modules/users/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '@technical/app-config/app-config';
import { DatetimeService } from '@technical/datetime/datetime.service';
import {
  AccessToken,
  AccessTokenPayload,
  RefreshToken,
  RefreshTokenHash,
} from '../types';
import { RefreshTokenEntity } from '@domain/auth/entities/refresh-token.entity';
import { randomBytes, randomUUID } from 'crypto';
import { UserId } from '@modules/users/types';
import { AppCacheService } from '@technical/cache/app-cache.service';
import crypto from 'crypto';

export interface CreateRefreshTokenOutput {
  tokenEntity: RefreshTokenEntity;
  token: RefreshToken;
  tokenHash: RefreshTokenHash;
}

@Injectable()
export class TokenService {
  private readonly sessionBlacklistTTL: number;
  private readonly accessTokenBlacklistTTL: number;
  private readonly refreshTokenBlacklistTTL: number;

  constructor(
    private readonly appConfig: AppConfig,
    private readonly jwtService: JwtService,
    private readonly datetimeService: DatetimeService,
    private readonly cacheService: AppCacheService,
  ) {
    this.sessionBlacklistTTL =
      appConfig.values.JWT_REFRESH_TOKEN_EXPIRATION_SEC * 1000;
    this.accessTokenBlacklistTTL =
      appConfig.values.JWT_ACCESS_TOKEN_EXPIRATION_SEC * 1000;
    this.refreshTokenBlacklistTTL =
      appConfig.values.JWT_REFRESH_TOKEN_EXPIRATION_SEC * 1000;
  }

  private composeSessionBlacklistKey(
    userId: UserId,
    sessionId: string,
  ): string {
    return `blacklist:session:${userId}:${sessionId}`;
  }

  private composeAccessTokenBlacklistKey(
    userId: UserId,
    token: AccessToken,
  ): string {
    return `blacklist:access_token:${userId}:${token}`;
  }

  private composeRefreshTokenBlacklistKey(token: RefreshToken): string {
    return `blacklist:refresh_token:${token}`;
  }

  async blacklistAccessToken(
    userId: UserId,
    token: AccessToken,
  ): Promise<void> {
    await this.cacheService.set(
      this.composeAccessTokenBlacklistKey(userId, token),
      '1',
      this.accessTokenBlacklistTTL,
    );
  }

  async isAccessTokenBlacklisted(
    userId: UserId,
    token: AccessToken,
  ): Promise<boolean> {
    return this.cacheService
      .get(this.composeAccessTokenBlacklistKey(userId, token))
      .then((v) => v != null);
  }

  async blacklistRefreshToken(token: RefreshToken): Promise<void> {
    await this.cacheService.set(
      this.composeRefreshTokenBlacklistKey(token),
      '1',
      this.refreshTokenBlacklistTTL,
    );
  }

  async isRefreshTokenBlacklisted(token: RefreshToken): Promise<boolean> {
    return this.cacheService
      .get(this.composeRefreshTokenBlacklistKey(token))
      .then((v) => v != null);
  }

  async blacklistSession(userId: UserId, sessionId: string): Promise<void> {
    await this.cacheService.set(
      this.composeSessionBlacklistKey(userId, sessionId),
      '1',
      this.sessionBlacklistTTL,
    );
  }

  async isSessionBlacklisted(
    userId: UserId,
    sessionId: string,
  ): Promise<boolean> {
    return this.cacheService
      .get(this.composeSessionBlacklistKey(userId, sessionId))
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

  createRefreshToken(
    user: UserEntity,
    family?: string,
  ): CreateRefreshTokenOutput {
    const token = this.generateRefreshToken();
    const tokenHash = this.hashRefreshToken(token);
    const createdAt = this.datetimeService.new();
    const expiresAt = this.datetimeService.addSeconds(
      createdAt,
      this.appConfig.values.JWT_REFRESH_TOKEN_EXPIRATION_SEC,
    );
    const tokenFamily = family ?? randomUUID();

    return {
      tokenEntity: RefreshTokenEntity.create({
        userId: user.id,
        tokenHash,
        family: tokenFamily,
        createdAt,
        expiresAt,
      }),
      token,
      tokenHash,
    };
  }

  public hashRefreshToken(token: RefreshToken): RefreshTokenHash {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex') as RefreshTokenHash;
  }

  private generateRefreshToken(): RefreshToken {
    return randomBytes(64).toString('hex') as RefreshToken;
  }
}
