import { UserId } from '@modules/users/types';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccessToken, RefreshToken } from '@domain/auth/types';
import { AppConfig } from '@technical/app-config/app-config';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { randomBytes, randomUUID } from 'crypto';
import { RefreshTokenEntity } from '../../domain/auth/entities/refresh-token.entity';
import { Repository } from 'typeorm';
import { UserEntity } from '@modules/users/entities/user.entity';
import { InvalidRefreshToken } from '@domain/auth/errors/invalid-refresh-token.error';

export interface GetTokensOutput {
  accessToken: AccessToken;
  refreshToken: RefreshToken;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: Repository<RefreshTokenEntity>,
    private jwtService: JwtService,
    private readonly appConfig: AppConfig,
    private readonly datetimeService: DatetimeService,
  ) {}

  async rotate(token: RefreshToken): Promise<GetTokensOutput> {
    return this.repository.manager.transaction(async (entityManager) => {
      const tokenRepository = entityManager.getRepository(RefreshTokenEntity);

      const existingToken = await tokenRepository.findOne({
        where: {
          token,
        },
        lock: {
          mode: 'pessimistic_write',
          onLocked: 'nowait',
        },
      });

      if (existingToken == null) throw new InvalidRefreshToken();

      const now = this.datetimeService.new();

      // theft detection, invalidate all user tokens
      if (existingToken.isRevoked() || existingToken.isReplaced()) {
        await tokenRepository.update(
          {
            family: existingToken.family,
          },
          {
            revokedAt: now,
          },
        );

        throw new InvalidRefreshToken();
      }

      //expired
      if (now > existingToken.expiresAt) {
        throw new InvalidRefreshToken();
      }

      const user = await entityManager
        .getRepository(UserEntity)
        .findOneBy({ id: existingToken.userId });

      if (user == null) throw new InvalidRefreshToken();
      if (!user.isActive) throw new InvalidRefreshToken();

      const accessToken = await this.generateAccessToken(user.id);
      const newRefreshToken = this.createRefreshToken(
        user.id,
        existingToken.family,
      );

      await tokenRepository.save(newRefreshToken);
      await tokenRepository.update(
        {
          token,
        },
        {
          revokedAt: now,
          replacedBy: newRefreshToken.id,
        },
      );

      return {
        accessToken,
        refreshToken: newRefreshToken.token,
      };
    });
  }

  async generateAccessToken(userId: UserId): Promise<AccessToken> {
    const now = this.datetimeService.nowInSeconds();
    const exp = now + this.appConfig.values.JWT_ACCESS_TOKEN_EXPIRATION_SEC;
    const payload = {
      sub: userId,
      exp,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.appConfig.values.JWT_ACCESS_TOKEN_SECRET,
    }) as Promise<AccessToken>;
  }

  createRefreshToken(userId: UserId, family?: string): RefreshTokenEntity {
    const token = randomBytes(64).toString('hex');
    const createdAt = this.datetimeService.new();
    const expiresAt = this.datetimeService.addSeconds(
      createdAt,
      this.appConfig.values.JWT_REFRESH_TOKEN_EXPIRATION_SEC,
    );
    const tokenFamily = family ?? randomUUID();

    return RefreshTokenEntity.create({
      userId,
      token: <RefreshToken>token,
      family: tokenFamily,
      createdAt,
      expiresAt,
    });
  }
}
