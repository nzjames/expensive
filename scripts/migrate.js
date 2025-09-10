import path from 'node:path';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import sqlite from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const dbPath = process.env.DATABASE_URL || './expense-prod.db';
const migrationsFolder = path.resolve(process.cwd(), '.drizzle/migrations');

console.log(`[migrate] Using DB: ${dbPath}`);
console.log(`[migrate] Migrations: ${migrationsFolder}`);

const sqliteDB = new sqlite(dbPath);
const db = drizzle(sqliteDB);

try {
  migrate(db, { migrationsFolder });
  console.log('[migrate] Completed');
} catch (err) {
  console.error('[migrate] Failed:', err);
  process.exit(1);
} finally {
  sqliteDB.close();
}

