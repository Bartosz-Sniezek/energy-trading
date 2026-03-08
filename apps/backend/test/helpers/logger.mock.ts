import { Logger } from '@nestjs/common';
import { mock } from 'vitest-mock-extended';

export const loggerMock = mock<Logger>();
