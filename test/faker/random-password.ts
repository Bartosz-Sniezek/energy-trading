import { faker } from '@faker-js/faker';
import { Password } from '@domain/users/value-objects/password';

export const randomPassword = (): Password => {
  return Password.create(
    faker.internet.password({
      length: 20,
    }) + 'aQ1!',
  );
};
