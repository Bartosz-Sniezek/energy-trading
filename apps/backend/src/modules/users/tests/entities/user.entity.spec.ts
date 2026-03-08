import { UserEntity } from '@modules/users/entities/user.entity';
import { addDays } from 'date-fns';
import { randomEmail } from 'test/faker/random-email';
import { randomFirstName } from 'test/faker/random-first-name';
import { randomHash } from 'test/faker/random-hash';
import { randomLastName } from 'test/faker/random-last-name';
import { randomToken } from 'test/faker/random-token';

describe(UserEntity.name, () => {
  describe(UserEntity.create.name, () => {
    it('should create an UserEntity instance', () => {
      const email = randomEmail();
      const passwordHash = randomHash();
      const firstName = randomFirstName();
      const lastName = randomLastName();
      const activationToken = randomToken();
      const now = new Date();
      const expirationDate = addDays(now, 1);

      const entity = UserEntity.create({
        email,
        passwordHash,
        firstName,
        lastName,
        activationToken,
        activationTokenExpiresAt: expirationDate,
        createdAt: now,
      });

      expect(entity.id).toBeDefined();
      expect(entity.id).toBeString();
      expect(entity.email).toBe(email.getValue());
      expect(entity.passwordHash).toBe(passwordHash);
      expect(entity.firstName).toBe(firstName);
      expect(entity.lastName).toBe(lastName);
      expect(entity.isActive).toBeFalse();
      expect(entity.activationToken).toBe(activationToken);
      expect(entity.activationTokenExpiresAt.getTime()).toBe(
        expirationDate.getTime(),
      );
      expect(entity.createdAt.getTime()).toBe(now.getTime());
      expect(entity.updatedAt.getTime()).toBe(now.getTime());
    });
  });
});
