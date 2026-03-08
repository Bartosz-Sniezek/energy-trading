import { faker } from '@faker-js/faker';
import { Email } from '@domain/users/value-objects/email';

export const randomEmail = (): Email => {
  return Email.create(faker.internet.email());
};
