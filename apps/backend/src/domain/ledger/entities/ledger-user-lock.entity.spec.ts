import { randomUserId } from 'test/faker/random-user-id';
import { LedgerUserLockEntity } from './ledger-user-lock.entity';

describe('LedgerUserLockEntity', () => {
  describe('create', () => {
    it('should create entity', () => {
      const userId = randomUserId();
      const now = new Date();
      const entity = LedgerUserLockEntity.create(userId, now);

      expect(entity.userId).toBe(userId);
      expect(entity.createdAt.getTime()).toBe(now.getTime());
    });
  });
});
