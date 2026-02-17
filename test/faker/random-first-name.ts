import { faker } from '@faker-js/faker';

export const randomFirstName = () => {
  return faker.person.firstName();
};
