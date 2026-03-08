export class InvalidMessageError extends Error {
  constructor(readonly data: string) {
    super(`Invalid message structure: ${data}`);
  }
}
