import { mock } from 'vitest-mock-extended';
import { TokenService } from './token.service';
import { AppConfig } from '@technical/app-config/app-config';
import { JwtService } from '@nestjs/jwt';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { UserEntity } from '@modules/users/entities/user.entity';
import { randomUserId } from 'test/faker/random-user-id';
import { vi } from 'vitest';
import { randomUUID } from 'crypto';
import { randomEmail } from 'test/faker/random-email';
import { AccessTokenPayload } from '../types';

describe(TokenService.name, () => {
  const appConfig = mock<AppConfig>({
    values: {
      JWT_ACCESS_TOKEN_SECRET: 'abc',
      JWT_ACCESS_TOKEN_EXPIRATION_SEC: 60,
      JWT_REFRESH_TOKEN_EXPIRATION_SEC: 120,
    },
  });
  const datetimeService = new DatetimeService();
  const jwtService = new JwtService();
  const userMock = mock<UserEntity>({
    id: randomUserId(),
    email: randomEmail().getValue(),
  });
  const newDateMock = new Date();
  vi.spyOn(datetimeService, 'new').mockReturnValue(newDateMock);
  const service = new TokenService(appConfig, jwtService, datetimeService);

  describe(service.createRefreshToken.name, () => {
    it('should create a refresh token with a new family', () => {
      const token = service.createRefreshToken(userMock);

      expect(token.id).toBeString();
      expect(token.userId).toBe(userMock.id);
      expect(token.family).toBeString();
      expect(token.revokedAt).toBeNull();
      expect(token.replacedBy).toBeNull();
      expect(token.createdAt.getTime()).toBe(newDateMock.getTime());
      expect(token.expiresAt.getTime()).toBe(
        newDateMock.getTime() + 120 * 1000,
      );
    });

    it('should create a refresh token reusing a family', () => {
      const family = randomUUID();
      const token = service.createRefreshToken(userMock, family);

      expect(token.id).toBeString();
      expect(token.userId).toBe(userMock.id);
      expect(token.family).toBe(family);
      expect(token.revokedAt).toBeNull();
      expect(token.replacedBy).toBeNull();
      expect(token.createdAt.getTime()).toBe(newDateMock.getTime());
      expect(token.expiresAt.getTime()).toBe(
        newDateMock.getTime() + 120 * 1000,
      );
    });

    it('should create a different refresh tokens each time', () => {
      const token = service.createRefreshToken(userMock);
      const secondToken = service.createRefreshToken(userMock);

      expect(token.id).not.toBe(secondToken.id);
      expect(token.userId).toBe(userMock.id);
      expect(token.family).not.toBe(secondToken.id);
    });
  });

  describe(service.generateAccessToken.name, () => {
    it('should create an access token', async () => {
      const token = await service.generateAccessToken(userMock);

      expect(token).toBeString();

      const payload = jwtService.decode(token, {
        json: true,
      });

      const iat = Math.floor(newDateMock.getTime() / 1000);
      expect(payload).toMatchObject<AccessTokenPayload>({
        sub: userMock.id,
        email: userMock.email,
        iat,
        exp: iat + appConfig.values.JWT_ACCESS_TOKEN_EXPIRATION_SEC,
        jti: expect.toBeString(),
      });
    });

    it('should create a different access tokens each time', async () => {
      const token = await service.generateAccessToken(userMock);
      const secondToken = await service.generateAccessToken(userMock);

      expect(token).not.toBe(secondToken);
    });
  });
});
