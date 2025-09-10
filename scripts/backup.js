import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sqlite from 'better-sqlite3';

function isUnderTmp(p) {
  const tmp = path.resolve(os.tmpdir());
  const resolved = path.resolve(p);
  return resolved.startsWith(tmp);
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
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
  const dbPath = process.env.DATABASE_URL || '/data/expense-prod.db';
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
  const backupDir = process.env.BACKUP_DIR || path.join(path.dirname(resolved), 'backups');
  await fs.promises.mkdir(backupDir, { recursive: true });
  const dest = path.join(backupDir, `${base}.${timestamp()}.db`);

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

