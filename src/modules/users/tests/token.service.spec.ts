import { TokensService } from '@modules/token.service';

describe(TokensService.name, () => {
  const service = new TokensService();

  describe('generateToken', () => {
    it('should generate a token', () => {
      const token = service.generateToken();

      expect(token).toBeDefined();
      expect(token).toBeString();
    });

    it('should generate a 128-character hex string', () => {
      const token = service.generateToken();

      expect(token).toHaveLength(128); // 64 bytes * 2 (hex encoding)
      expect(token).toMatch(/^[0-9a-f]{128}$/);
    });

    it('should generate unique tokens on each call', () => {
      const token1 = service.generateToken();
      const token2 = service.generateToken();
      const token3 = service.generateToken();

      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });
  });
});
