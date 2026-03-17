import { INestApplication } from '@nestjs/common';
import { AppConfig } from '@technical/app-config/app-config';
import cookieParser from 'cookie-parser';

export const configureApp = (app: INestApplication): void => {
  const config = app.get(AppConfig);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(cookieParser(config.values.COOKIE_SECRET));
};
