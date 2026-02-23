import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfig } from '@technical/app-config/app-config';
import { configureApp } from './configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get(AppConfig);

  configureApp(app);

  await app.listen(appConfig.values.PORT, '127.0.0.1', () => {
    console.log(`Server is listening on the port ${appConfig.values.PORT}`);
  });
}

bootstrap().catch((error) => {
  throw error;
});
