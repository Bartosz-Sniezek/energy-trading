import { ClsService } from 'nestjs-cls';
import { withCorrelationIdContext } from './with-correlation-id-context';

export const withRandomCorrelationContext = <TArgs extends unknown[], TResult>(
  store: ClsService,
  fn: (...args: TArgs) => Promise<TResult>,
): ((...args: TArgs) => Promise<TResult>) => {
  return (...args: TArgs) => withCorrelationIdContext(store, () => fn(...args));
};

export type ContextedFn<T extends (...args: any[]) => Promise<any>> = (
  ...args: Parameters<T>
) => ReturnType<T>;
