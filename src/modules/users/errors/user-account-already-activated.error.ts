export class UserAccountAlreadyActivatedError extends Error {
  constructor() {
    super('User account is already activated');
  }
}
