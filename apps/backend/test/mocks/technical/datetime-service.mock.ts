import { DatetimeService } from '@technical/datetime/datetime.service';
import { mock, mockReset } from 'vitest-mock-extended';

export const createDatetimeServiceMock = () => {
  const datetimeServiceMock = mock<DatetimeService>();

  return {
    datetimeServiceMock,
    resetDatetimeServiceMock: () => {
      mockReset(datetimeServiceMock);
    },
  };
};
