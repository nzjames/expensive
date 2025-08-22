import { drizzle } from 'drizzle-orm/better-sqlite3';
import sqlite from 'better-sqlite3';
import * as schema from './schema';

const sqliteDB = new sqlite('sqlite.db');
export const db = drizzle(sqliteDB, { schema });
