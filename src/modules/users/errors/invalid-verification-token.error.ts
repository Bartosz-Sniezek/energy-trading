export class InvalidVerificationTokenError extends Error {
  constructor() {
    super('Invalid verification token');
  }
}
