import { execSync } from 'child_process';

export async function setup() {
  execSync('NODE_ENV=test tsx db/reset-database.ts', {
    stdio: 'inherit',
  });
}
