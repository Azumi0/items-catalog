import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { getDb } from './index';
import path from 'path';

export function runMigrations(migrationsFolder?: string) {
  const db = getDb();
  const folder = migrationsFolder || path.resolve(process.cwd(), 'drizzle');
  migrate(db, { migrationsFolder: folder });
}

const isMain = process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js');
if (isMain) {
  console.log('Running database migrations...');
  runMigrations();
  console.log('Migrations completed successfully.');
}
