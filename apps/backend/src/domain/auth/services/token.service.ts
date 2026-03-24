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
import { Email } from '@domain/users/value-objects/email';

export interface CreateRefreshTokenOutput {
  tokenEntity: RefreshTokenEntity;
  token: RefreshToken;
  tokenHash: RefreshTokenHash;
}

export interface SerializedAccountActivationChallenge {
  email: string;
  challengeKey: string;
  token: string;
  expiresAt: string;
}

export interface AccountActivationChallenge {
  email: Email;
  challengeKey: string;
  token: string;
  expiresAt: Date;
}

@Injectable()
export class TokenService {
  private readonly sessionBlacklistTTL: number;
  private readonly accessTokenBlacklistTTL: number;
  private readonly refreshTokenBlacklistTTL: number;
  private readonly accountActivationResendTokenTTL: number;

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
    this.accountActivationResendTokenTTL =
      appConfig.values.ACCOUNT_ACTIVATION_RESEND_TOKEN_TTL_SECONDS * 1000;
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

  private composeAccountActivationTokenChallengeKeyByEmail(
    email: Email,
  ): string {
    return `key:account_activation_token_challenge:by:email:${email.getValue()}`;
  }

  private composeAccountActivationTokenChallengeKeyByToken(
    token: string,
  ): string {
    return `key:account_activation_token_challenge:by:token:${token}`;
  }

  async getAccountActivationChallengeByEmail(
    email: Email,
  ): Promise<AccountActivationChallenge | null> {
    const key = await this.cacheService.get<string>(
      this.composeAccountActivationTokenChallengeKeyByEmail(email),
    );

    if (key == null) return null;

    const data =
      await this.cacheService.get<SerializedAccountActivationChallenge>(key);

    if (data) {
      return {
        email: Email.create(data.email),
        challengeKey: data.challengeKey,
        token: data.token,
        expiresAt: new Date(data.expiresAt),
      };
    }

    return null;
  }

  async getAccountActivationChallengeByToken(
    token: string,
  ): Promise<AccountActivationChallenge | null> {
    const key = await this.cacheService.get<string>(
      this.composeAccountActivationTokenChallengeKeyByToken(token),
    );

    if (key == null) return null;

    const data =
      await this.cacheService.get<SerializedAccountActivationChallenge>(key);

    if (data) {
      return {
        email: Email.create(data.email),
        challengeKey: data.challengeKey,
        token: data.token,
        expiresAt: new Date(data.expiresAt),
      };
    }

    return null;
  }

  async generateResendActivationChallenge(
    email: Email,
  ): Promise<AccountActivationChallenge> {
    const key = `activation_token_challage_key:${randomUUID()}`;
    const data: AccountActivationChallenge = {
      challengeKey: key,
      email,
      token: randomBytes(32).toString('hex'),
      expiresAt: this.datetimeService.addSeconds(
        this.datetimeService.new(),
        this.accountActivationResendTokenTTL,
      ),
    };

    await Promise.all([
      this.cacheService.set(
        this.composeAccountActivationTokenChallengeKeyByEmail(email),
        key,
        this.accountActivationResendTokenTTL,
      ),
      this.cacheService.set(
        this.composeAccountActivationTokenChallengeKeyByToken(data.token),
        key,
        this.accountActivationResendTokenTTL,
      ),
    ]);

    await this.cacheService.set(
      key,
      <SerializedAccountActivationChallenge>{
        email: email.getValue(),
        challengeKey: key,
        token: data.token,
        expiresAt: data.expiresAt.toISOString(),
      },
      this.accountActivationResendTokenTTL,
    );

    return data;
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
