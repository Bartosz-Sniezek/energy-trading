import { HashingService } from './hashing.service';

describe(HashingService.name, () => {
  const service = new HashingService(5);

  describe('hash', () => {
    it('should hash a password', async () => {
      const password = 'myPassword123';
      const hash = await service.hash(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'myPassword123';
      const hash1 = await service.hash(password);
      const hash2 = await service.hash(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', async () => {
      const hash = await service.hash('');
      expect(hash).toBeDefined();
    });
  });

  describe('compare', () => {
    it('should return true for matching password', async () => {
      const password = 'myPassword123';
      const hash = await service.hash(password);

      const isMatch = await service.compare(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'myPassword123';
      const wrongPassword = 'wrongPassword';
      const hash = await service.hash(password);

      const isMatch = await service.compare(wrongPassword, hash);
      expect(isMatch).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'MyPassword123';
      const hash = await service.hash(password);

      const isMatch = await service.compare('mypassword123', hash);
      expect(isMatch).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      const hash = await service.hash('password');
      const isMatch = await service.compare('', hash);

      expect(isMatch).toBe(false);
    });
  });
});
