// Ensures server-side tests run against a temp, migrated SQLite DB and cleans up.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { afterAll } from 'vitest';

// Always isolate DB for server tests, even if DATABASE_URL is set.
const _vitestTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expense-vitest-'));
const _vitestTempDbPath = path.join(_vitestTempDir, 'test.db');
process.env.DATABASE_URL = _vitestTempDbPath;

// Now import and run migrations
import { db } from '$lib/server/db/client';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

try {
  migrate(db, { migrationsFolder: path.resolve(process.cwd(), '.drizzle/migrations') });
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Vitest server setup migration failed:', err);
  throw err;
}

// Cleanup temp DB after all tests in this worker complete
afterAll(() => {
  try {
    fs.rmSync(_vitestTempDir, { recursive: true, force: true });
  } catch {}
});
