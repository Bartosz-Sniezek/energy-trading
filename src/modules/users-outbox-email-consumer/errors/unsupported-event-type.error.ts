export class UnsupportedEventTypeError extends Error {
  constructor(event: string) {
    super(`Unsupported event type: ${event}`);
  }
}
