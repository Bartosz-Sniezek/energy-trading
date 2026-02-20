export class NullMessageError extends Error {
  constructor() {
    super('Message is null');
  }
}
