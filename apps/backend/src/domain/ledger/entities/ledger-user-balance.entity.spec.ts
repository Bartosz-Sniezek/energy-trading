import { randomUserId } from 'test/faker/random-user-id';
import { LedgerUserBalanceEntity } from './ledger-user-balance.entity';

describe('LedgerUserBalanceEntity', () => {
  describe('create', () => {
    it('should create entity', () => {
      const userId = randomUserId();
      const entity = LedgerUserBalanceEntity.create(userId);

      expect(entity.userId).toBe(userId);
      expect(entity.available).toBe('0.000000');
      expect(entity.locked).toBe('0.000000');
    });
  });
});
