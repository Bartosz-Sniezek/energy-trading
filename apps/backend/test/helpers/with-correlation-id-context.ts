import { CLS_ID, ClsService } from 'nestjs-cls';
import { randomCorrelationId } from 'test/faker/random-correlation-id';

export const withCorrelationIdContext = async <T>(
  store: ClsService,
  callback: () => Promise<T>,
  options?: { correlationId?: string },
): Promise<T> => {
  return store.run(async () => {
    store.set(CLS_ID, options?.correlationId ?? randomCorrelationId());

    return await callback();
  });
};
