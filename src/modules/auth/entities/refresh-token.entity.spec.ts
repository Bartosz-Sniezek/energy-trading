import { randomRefreshToken } from 'test/faker/random-refresh-token';
import { RefreshTokenEntity } from './refresh-token.entity';
import { randomUserId } from 'test/faker/random-user-id';
import { addMinutes } from 'date-fns';

describe(RefreshTokenEntity.name, () => {
  describe(RefreshTokenEntity.create.name, () => {
    it('should create RefreshTokenEntity instance', () => {
      const token = randomRefreshToken();
      const userId = randomUserId();
      const createdAt = new Date();
      const expirationDate = addMinutes(createdAt, 3);

      const refreshToken = RefreshTokenEntity.create({
        userId,
        token,
        createdAt,
        expirationDate,
      });

      expect(refreshToken.id).toBeString();
      expect(refreshToken.userId).toBe(userId);
      expect(refreshToken.token).toBe(token);
      expect(refreshToken.expirationDate.getTime()).toBe(
        expirationDate.getTime(),
      );
      expect(refreshToken.createdAt.getTime()).toBe(createdAt.getTime());
    });
  });
});
