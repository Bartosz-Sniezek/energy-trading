import { RefreshTokenEntity } from '@domain/auth/entities/refresh-token.entity';
import { InvalidRefreshToken } from '@domain/auth/errors/invalid-refresh-token.error';
import { RefreshToken, TokenGenerationOutput } from '@domain/auth/types';
import { UserEntity } from '@domain/users/entities/user.entity';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { DataSource, IsNull } from 'typeorm';
import { TokenService } from '@domain/auth/services/token.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { SessionAuthBridge } from '@domain/auth/services/session-auth.bridge';

type TransactionSuccessResultData = TokenGenerationOutput & {
  refreshTokenFamiliy: string;
};
type TransactionResult =
  | {
      success: true;
      data: TransactionSuccessResultData;
    }
  | { success: false; error: InvalidRefreshToken };

export class RotateTokenUseCase {
  constructor(
    @InjectDataSource()
    private readonly datasource: DataSource,
    private readonly datetimeService: DatetimeService,
    private readonly tokenService: TokenService,
    private readonly sessionAuthBridge: SessionAuthBridge,
  ) {}

  async execute(token: RefreshToken): Promise<TokenGenerationOutput> {
    const result = await this.handle(token);

    await this.tokenService.blacklistRefreshToken(token);

    if (!result.success) {
      if (result.error.family)
        await this.sessionAuthBridge.removeSessionFromCache(
          result.error.family,
        );

      throw result.error;
    }

    await this.sessionAuthBridge.setSessionInCache(
      result.data.refreshTokenFamiliy,
    );
    return {
      accessToken: result.data.accessToken,
      refreshToken: result.data.refreshToken,
    };
  }

  private async handle(token: RefreshToken): Promise<TransactionResult> {
    const tokenHash = this.tokenService.hashRefreshToken(token);

    return this.datasource.transaction<TransactionResult>(
      async (entityManager) => {
        const tokenRepository = entityManager.getRepository(RefreshTokenEntity);

        const existingToken = await tokenRepository.findOne({
          where: {
            tokenHash,
          },
          lock: {
            mode: 'pessimistic_write',
            onLocked: 'nowait',
          },
        });

        if (existingToken == null)
          return { success: false, error: new InvalidRefreshToken() };

        const now = this.datetimeService.new();

        // theft detection, invalidate all user tokens
        if (existingToken.isRevoked() || existingToken.isReplaced()) {
          await this.tokenService.blacklistSession(
            existingToken.userId,
            existingToken.family,
          );
          await tokenRepository.update(
            {
              userId: existingToken.userId,
              family: existingToken.family,
              revokedAt: IsNull(),
            },
            {
              revokedAt: now,
            },
          );

          return {
            success: false,
            error: new InvalidRefreshToken(existingToken.family),
          };
        }

        //expired
        if (now > existingToken.expiresAt) {
          return {
            success: false,
            error: new InvalidRefreshToken(existingToken.family),
          };
        }

        const user = await entityManager
          .getRepository(UserEntity)
          .findOneBy({ id: existingToken.userId });

        if (user == null)
          return {
            success: false,
            error: new InvalidRefreshToken(existingToken.family),
          };
        if (!user.isActive)
          return {
            success: false,
            error: new InvalidRefreshToken(existingToken.family),
          };

        const newRefreshToken = this.tokenService.createRefreshToken(
          user,
          existingToken.family,
        );
        const accessToken = await this.tokenService.generateAccessToken(
          user,
          existingToken.family,
        );

        await tokenRepository.save(newRefreshToken.tokenEntity);
        await tokenRepository.update(
          {
            tokenHash,
          },
          {
            revokedAt: now,
            replacedBy: newRefreshToken.tokenEntity.id,
          },
        );

        return {
          success: true,
          data: {
            accessToken,
            refreshToken: newRefreshToken.token,
            refreshTokenFamiliy: newRefreshToken.tokenEntity.family,
          },
        };
      },
    );
  }
}
