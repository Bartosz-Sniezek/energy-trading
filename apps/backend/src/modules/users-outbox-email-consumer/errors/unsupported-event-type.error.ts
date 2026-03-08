import { PermanentError } from '@common/kafka/permanent.error';

export class UnsupportedEventTypeError extends PermanentError {
  constructor(event: string) {
    super(`Unsupported event type: ${event}`);
  }
}
