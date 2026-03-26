import { ClsService, ClsStore } from 'nestjs-cls';
import { mock, mockReset, MockProxy } from 'vitest-mock-extended';

type ClsServiceMock = MockProxy<ClsService<ClsStore>>;

export const createClsServiceMock = (): {
  clsServiceMock: ClsServiceMock;
  resetClsServiceMock: () => void;
} => {
  const clsServiceMock = mock<ClsService>();

  return {
    clsServiceMock,
    resetClsServiceMock: () => mockReset(clsServiceMock),
  };
};
