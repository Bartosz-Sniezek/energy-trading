import { configDotenv } from 'dotenv';
import { DataSource } from 'typeorm';
import path from 'path';
import { existsSync } from 'fs';

const envFilePath = path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`);

if (existsSync(envFilePath)) {
  configDotenv({
    path: envFilePath,
    quiet: true,
  });
} else {
  console.warn(`${envFilePath} not found`);
}

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  migrations: ['db/migrations/*.ts'],
  synchronize: false,
  logger: 'simple-console',
});
