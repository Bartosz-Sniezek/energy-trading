import { InvalidMessageError } from '@common/errors/invalid-message.error';
import { NullMessageError } from '@common/errors/null-message.error';

export const kafkaMessageJSONParser = <T extends object>(
  message: Buffer<ArrayBufferLike> | null,
  callback: (jsonData: unknown) => T | null,
): T => {
  if (message == null) throw new NullMessageError();

  const stringData = message.toString();
  const jsonData: unknown = JSON.parse(stringData);
  const event = callback(jsonData);

  if (event == null) throw new InvalidMessageError(stringData);

  return event;
};
