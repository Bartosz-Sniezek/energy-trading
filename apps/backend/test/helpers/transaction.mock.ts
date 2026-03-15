import { DataSource, EntityManager } from 'typeorm';
import { mock, mockReset } from 'vitest-mock-extended';

export const createTransactionMock = () => {
  const datasourceMock = mock<DataSource>();
  const entityManagerMock = mock<EntityManager>();

  datasourceMock.transaction.mockImplementation(async (...args: any[]) => {
    const cb = args.find((a) => typeof a === 'function');
    return cb(entityManagerMock);
  });

  const resetTransactionMock = () => {
    mockReset(datasourceMock);
    mockReset(entityManagerMock);

    datasourceMock.transaction.mockImplementation(async (...args: any[]) => {
      const cb = args.find((a) => typeof a === 'function');
      return cb(entityManagerMock);
    });
  };

  return {
    datasourceMock,
    entityManagerMock,
    resetTransactionMock,
  };
};
