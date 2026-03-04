import { execSync } from 'child_process';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';
import { randomBytes } from 'crypto';

export default async function setup() {
  const database = `${Date.now()}-${randomBytes(32).toString('hex')}`;
  const [pgContainer, redisContainer] = await Promise.all([
    new PostgreSqlContainer(`postgres:18.1`)
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
      .start(),
    new RedisContainer('redis:7.4-alpine').start(),
  ]);

  process.env.DATABASE_URL = pgContainer.getConnectionUri();
  process.env.REDIS_URL = redisContainer.getConnectionUrl();

  execSync('tsx db/reset-database.ts', {
    stdio: 'inherit',
  });

  return function teardown() {
    console.log('Vitest setup teardown');
    pgContainer.stop().then(() => console.log('PostgreSqlContainer stopped'));
    redisContainer.stop().then(() => console.log('RedisContainer stopped'));
  };
}
