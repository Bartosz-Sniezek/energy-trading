import { faker } from '@faker-js/faker';

export const randomLastName = () => {
  return faker.person.lastName();
};
