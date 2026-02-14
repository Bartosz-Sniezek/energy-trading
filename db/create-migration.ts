import { execSync } from 'child_process';

const args = process.argv.slice(2);
const nameArg = args.find((arg) => arg.startsWith('--name='));

if (!nameArg) {
  console.error('Please provide --name=YourMigrationName');
  process.exit(1);
}

const name = nameArg.split('=')[1];
const isValidName = /^[a-zA-Z][a-zA-Z0-9]*$/.test(name);

if (!isValidName) {
  console.error('❌ Invalid migration name!');
  console.error('Migration name must:');
  console.error('  - Contain only letters and numbers (a-z, A-Z, 0-9)');
  console.error('  - Start with a letter (not a number)');
  console.error(`\nProvided: "${name}"`);
  process.exit(1);
}

const path = `db/migrations/${name}`;

try {
  execSync(`typeorm migration:create ${path}`, { stdio: 'inherit' });
} catch (error) {
  process.exit(1);
}
