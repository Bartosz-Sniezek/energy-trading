export class EmailVerificationTokenExpiredError extends Error {
  constructor() {
    super('Email verification token expired');
  }
}
