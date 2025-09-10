import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createDb } from './client';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

export type TestDbHandle = {
  dbPath: string;
  cleanup: () => void;
};

export function setupTempDb(): TestDbHandle {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'expense-db-'));
  const dbPath = path.join(dir, 'test.db');
  // create and migrate
  const db = createDb(dbPath);
  migrate(db, { migrationsFolder: path.resolve(process.cwd(), '.drizzle/migrations') });

  return {
    dbPath,
    cleanup: () => {
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    }
  };
}

