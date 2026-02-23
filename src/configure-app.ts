import { DomainErrorFilter } from '@common/filters/domain-error.filter';
import { INestApplication } from '@nestjs/common';

export const configureApp = (app: INestApplication): void => {
  app.useGlobalFilters(new DomainErrorFilter());
};
