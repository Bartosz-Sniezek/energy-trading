import { mock, mockReset } from 'vitest-mock-extended';
import { LogoutUseCase } from './logout.use-case';
import { IsNull, Repository } from 'typeorm';
import { RefreshTokenEntity } from '@domain/auth/entities/refresh-token.entity';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { TokenService } from '@domain/auth/services/token.service';
import { AuthenticatedUser } from '@domain/auth/types';
import { randomUserId } from 'test/faker/random-user-id';
import { randomBytes, randomUUID } from 'crypto';
import { randomEmail } from 'test/faker/random-email';

describe(LogoutUseCase.name, () => {
  const refreshTokenRepository = mock<Repository<RefreshTokenEntity>>();
  const datetimeService = mock<DatetimeService>();
  const tokenService = mock<TokenService>();
  const now = new Date();

  beforeEach(() => {
    mockReset(refreshTokenRepository);
    mockReset(datetimeService);
    mockReset(tokenService);
    datetimeService.new.mockReturnValue(now);
  });

  const user: AuthenticatedUser = {
    userId: randomUserId(),
    email: randomEmail().getValue(),
    sessionId: randomUUID(),
  };
  const logoutUseCase = new LogoutUseCase(
    refreshTokenRepository,
    datetimeService,
    tokenService,
  );

  describe(LogoutUseCase.prototype.execute.name, () => {
    it('should resolve if session is already blacklisted', async () => {
      tokenService.isSessionBlacklisted.mockResolvedValue(true);

      await expect(logoutUseCase.execute(user)).toResolve();

      expect(tokenService.blacklistSession).not.toHaveBeenCalled();
      expect(refreshTokenRepository.update).not.toHaveBeenCalled();
    });

    it('should blacklist user session', async () => {
      tokenService.isSessionBlacklisted.mockResolvedValue(false);

      await expect(logoutUseCase.execute(user)).toResolve();

      expect(tokenService.blacklistSession).toHaveBeenCalledWith(
        user.userId,
        user.sessionId,
      );
    });

    it('should invalidate user token', async () => {
      tokenService.isSessionBlacklisted.mockResolvedValue(false);

      await expect(logoutUseCase.execute(user)).toResolve();

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        {
          userId: user.userId,
          family: user.sessionId,
          revokedAt: IsNull(),
        },
        {
          revokedAt: now,
        },
      );
    });
  });
});
