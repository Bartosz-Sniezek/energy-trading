import { v7 } from 'uuid';

export const randomCorrelationId = (): string => {
  return v7();
};
