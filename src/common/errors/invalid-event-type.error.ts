export class InvalidEventTypeError extends Error {
  constructor(event: string) {
    super(`Invalid event type: ${event}`);
  }
}
