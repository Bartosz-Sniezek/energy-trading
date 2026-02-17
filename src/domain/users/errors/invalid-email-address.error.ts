export class InvalidEmailAddressError extends Error {
  constructor(value: string) {
    super(`Invalid email address: ${value}`);
  }
}
