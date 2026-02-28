import { randomRefreshToken } from 'test/faker/random-refresh-token';
import { RefreshTokenEntity } from './refresh-token.entity';
import { randomUserId } from 'test/faker/random-user-id';
import { addMinutes } from 'date-fns';
import { randomUUID } from 'crypto';

describe(RefreshTokenEntity.name, () => {
  describe(RefreshTokenEntity.create.name, () => {
    it('should create RefreshTokenEntity instance', () => {
      const token = randomRefreshToken();
      const userId = randomUserId();
      const createdAt = new Date();
      const family = randomUUID();
      const expiresAt = addMinutes(createdAt, 3);

      const refreshToken = RefreshTokenEntity.create({
        userId,
        token,
        family,
        createdAt,
        expiresAt,
      });

      expect(refreshToken.id).toBeString();
      expect(refreshToken.userId).toBe(userId);
      expect(refreshToken.token).toBe(token);
      expect(refreshToken.family).toBe(family);
      expect(refreshToken.expiresAt.getTime()).toBe(expiresAt.getTime());
      expect(refreshToken.createdAt.getTime()).toBe(createdAt.getTime());
    });
  });
});
