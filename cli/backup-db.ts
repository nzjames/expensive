import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sqlite from 'better-sqlite3';

function isUnderTmp(p: string) {
  const tmp = path.resolve(os.tmpdir());
  const resolved = path.resolve(p);
  return resolved.startsWith(tmp);
}

function timestamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    '-' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

async function main() {
  // Allow --db=/path/to.db override, else use env or fallback
  const arg = process.argv.find((a) => a.startsWith('--db='));
  // Prefer explicit CLI arg, then env, then default to expense-dev.db (do not assume prod)
  const dbPath = arg ? arg.slice('--db='.length) : (process.env.DATABASE_URL ?? 'expense-dev.db');
  const resolved = path.resolve(dbPath);

  if (!fs.existsSync(resolved)) {
    console.error(`DB file not found: ${resolved}`);
    process.exit(1);
  }
  if (isUnderTmp(resolved)) {
    console.error('Refusing to back up a temp/test database.');
    process.exit(2);
  }

  const base = path.basename(resolved, path.extname(resolved));
  const dest = path.resolve(process.cwd(), `${base}.${timestamp()}.db`);

  // Use better-sqlite3 backup API for WAL-safe copy
  const db = new sqlite(resolved, { readonly: true });
  try {
    await db.backup(dest);
  } finally {
    db.close();
  }
  console.log(`Backup written: ${dest}`);
}

main().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
