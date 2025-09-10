import { drizzle } from 'drizzle-orm/better-sqlite3';
import sqlite from 'better-sqlite3';
import * as schema from './schema';
import { getDbPath } from '$lib/server/config';

function openSqlite(path: string) {
  const s = new sqlite(path);
  try {
    s.pragma('journal_mode = WAL');
  } catch {}
  try {
    s.pragma('foreign_keys = ON');
  } catch {}
  return s;
}

export function createDb(dbPath = getDbPath()) {
  const sqliteDB = openSqlite(dbPath);
  return drizzle(sqliteDB, { schema });
}

export const db = createDb();
