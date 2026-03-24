import { mock, mockReset } from 'vitest-mock-extended';
import { SessionAuthBridge } from './session-auth.bridge';
import { AppConfig } from '@technical/app-config/app-config';
import { RedisClient } from '@technical/redis/redis.client';
import { RedisPub } from '@technical/redis/redis-pub';
import { randomUUID } from 'crypto';

describe('SessionAuthBridge', () => {
  const appConfigMock = mock<AppConfig>({
    values: {
      JWT_ACCESS_TOKEN_EXPIRATION_SEC: 60,
    },
  });
  const redisClientMock = mock<RedisClient>();
  const redisPubMock = mock<RedisPub>();

  let sessionId: string;
  let key: string;

  beforeEach(() => {
    mockReset(appConfigMock);
    mockReset(redisClientMock);
    mockReset(redisPubMock);
    sessionId = randomUUID();
    key = `auth:session:${sessionId}`;
  });

  const service = new SessionAuthBridge(
    appConfigMock,
    redisClientMock,
    redisPubMock,
  );

  describe(service.setSessionInCache.name, () => {
    it('should set session in cache', async () => {
      await expect(service.setSessionInCache(sessionId)).toResolve();
      expect(redisClientMock.set).toHaveBeenCalledWith(
        key,
        1,
        'EX',
        appConfigMock.values.JWT_ACCESS_TOKEN_EXPIRATION_SEC,
      );
    });
  });

  describe(service.sessionExists.name, () => {
    it('should return true if session exists', async () => {
      redisClientMock.get.mockResolvedValue('1');
      await expect(service.sessionExists(sessionId)).resolves.toBeTrue();
      expect(redisClientMock.get).toHaveBeenCalledWith(key);
    });

    it('should return false if session does not exists', async () => {
      redisClientMock.get.mockResolvedValue(null);
      await expect(service.sessionExists(sessionId)).resolves.toBeFalse();
      expect(redisClientMock.get).toHaveBeenCalledWith(key);
    });
  });

  describe(service.removeSessionFromCache.name, () => {
    it('should remove session from a cache', async () => {
      await expect(service.removeSessionFromCache(sessionId)).toResolve();
      expect(redisClientMock.del).toHaveBeenCalledWith(key);
    });

    it('should publish auth:session:remove with sessionId', async () => {
      await expect(service.removeSessionFromCache(sessionId)).toResolve();
      expect(redisPubMock.publish).toHaveBeenCalledWith(
        'auth:session:remove',
        sessionId,
      );
    });
  });
});
