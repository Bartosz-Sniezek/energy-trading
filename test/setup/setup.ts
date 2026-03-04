import { execSync } from 'child_process';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { randomBytes } from 'crypto';

export default async function setup() {
  const database = `${Date.now()}-${randomBytes(32).toString('hex')}`;
  const pgContainer = await new PostgreSqlContainer(`postgres:18.1`)
    .withDatabase(database)
    .withCommand([
      'postgres',
      '-c',
      'wal_level=logical',
      '-c',
      'max_wal_senders=4',
      '-c',
      'max_replication_slots=4',
    ])
    .start();

  process.env.DATABASE_URL = pgContainer.getConnectionUri();

  execSync('tsx db/reset-database.ts', {
    stdio: 'inherit',
  });

  return function teardown() {
    console.log('Vitest setup teardown');
    pgContainer.stop().then(() => console.log('PostgreSqlContainer stopped'));
  };
}
