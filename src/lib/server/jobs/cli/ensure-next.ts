#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { db } from '../../db/client';
import { expenseTemplates, expenseInstances } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

const lockDir = path.resolve(process.cwd(), '.joblocks');
const lockFile = path.join(lockDir, 'ensure-next.lock');

function createLock() {
  fs.mkdirSync(lockDir, { recursive: true });
  // create exclusive lock file. throws if exists.
  return fs.openSync(lockFile, 'wx');
}

function releaseLock(fd: number) {
  try { fs.closeSync(fd); } catch {}
  try { fs.unlinkSync(lockFile); } catch {}
}

function ensureNextSync() {
  console.log("🔄 Running ensureNextSync...");

  const templates = db
    .select()
    .from(expenseTemplates)
    .where(eq(expenseTemplates.status, "Active"))
    .all();

  console.log(`📊 Found ${templates.length} active templates`);

  for (const tpl of templates) {
    console.log(`➡️ Checking template ${tpl.id} (${tpl.name ?? "unnamed"})`);

    if (!tpl.nextDate) {
      console.log(`   ⏭️ Skipping — no nextDate set`);
      continue;
    }

    try {
      db.transaction((tx) => {
        console.log(`   🔍 Checking for existing instance on ${tpl.nextDate}`);

        const existing = tx
          .select()
          .from(expenseInstances)
          .where(
            and(
              eq(expenseInstances.templateId, tpl.id),
              eq(expenseInstances.expectedDate, tpl.nextDate)
            )
          )
          .all();

        if (existing.length) {
          console.log(
            `   ✅ Already have ${existing.length} instance(s) for ${tpl.nextDate}`
          );
          return;
        }

        console.log(
          `   ➕ Inserting new instance for template ${tpl.id} on ${tpl.nextDate}`
        );

        const res = tx
          .insert(expenseInstances)
          .values({
            templateId: tpl.id,
            expectedDate: tpl.nextDate,
            amountCents: tpl.amountCents ?? null,
            status: "pending",
            createdAt: new Date().toISOString(),
          })
          .run?.(); // with better-sqlite3, .run() is often required

        console.log(`   ✅ Insert result:`, res);
      });
    } catch (err: any) {
      if (
        err &&
        (err.code === "SQLITE_CONSTRAINT" ||
          String(err).includes("already exists"))
      ) {
        console.log(
          `   ⚠️ Constraint error (already exists) for template ${tpl.id}`
        );
        continue;
      }
      console.error(`   ❌ Error for template ${tpl.id}:`, err);
      throw err;
    }
  }

  console.log("🏁 Finished ensureNextSync");
}


function main() {
  let fd: number | null = null;
  try {
    fd = createLock();
  } catch (err: any) {
    if (err && err.code === 'EEXIST') {
      console.log('ensure-next: another run is active. exiting.');
      process.exit(0);
    }
    console.error('ensure-next: failed to acquire lock', err);
    process.exit(1);
  }

  try {
    ensureNextSync();
    console.log('ensure-next: done');
  } catch (err) {
    console.error('ensure-next: error', err);
    process.exitCode = 1;
  } finally {
    if (fd !== null) releaseLock(fd);
  }
}

main();
