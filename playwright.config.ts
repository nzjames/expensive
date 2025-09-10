import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { createDb } from './src/lib/server/db/client';

// Create a temp, migrated DB for e2e and pass it to the preview server
const _e2eTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expense-e2e-'));
const _e2eDbPath = path.join(_e2eTempDir, 'e2e.db');
process.env.PLAYWRIGHT_TEST_DB_DIR = _e2eTempDir;
process.env.PLAYWRIGHT_TEST_DATABASE_URL = _e2eDbPath;

try {
  const db = createDb(_e2eDbPath);
  migrate(db, { migrationsFolder: path.resolve(process.cwd(), '.drizzle/migrations') });
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Playwright DB migration failed:', err);
  throw err;
}

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		env: {
			DATABASE_URL: _e2eDbPath
		}
	},
	testDir: 'e2e',
	globalTeardown: './e2e/global-teardown.ts'
});
