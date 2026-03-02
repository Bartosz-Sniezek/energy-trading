import { UserEntity } from '@modules/users/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '@technical/app-config/app-config';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { AccessToken, AccessTokenPayload, RefreshToken } from '../types';
import { RefreshTokenEntity } from '@domain/auth/entities/refresh-token.entity';
import { randomBytes, randomUUID } from 'crypto';

@Injectable()
export class TokenService {
  constructor(
    private readonly appConfig: AppConfig,
    private readonly jwtService: JwtService,
    private readonly datetimeService: DatetimeService,
  ) {}

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
