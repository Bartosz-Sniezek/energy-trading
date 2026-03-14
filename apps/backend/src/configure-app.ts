import { ProblemDetailsErrorFilter } from '@common/filters/problem-details-error.filter';
import { INestApplication } from '@nestjs/common';
import { AppConfig } from '@technical/app-config/app-config';
import cookieParser from 'cookie-parser';

export const configureApp = (app: INestApplication): void => {
  const config = app.get(AppConfig);

  app.setGlobalPrefix('api');

  app.use(cookieParser(config.values.COOKIE_SECRET));
  // app.useGlobalFilters(new ProblemDetailsErrorFilter());
};
