#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { db } from '../../db/client';
import { expenseSeries, expenseHistory } from '../../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { SeriesStatus } from '../../../data';
import { addInterval, ymdTodayUTC } from '../../../helpers/date';
import { occurrencesBetween, nextAfter } from '../../recurrence';

const lockDir = path.resolve(process.cwd(), '.joblocks');
const lockFile = path.join(lockDir, 'ensure-next.lock');

function createLock() {
	fs.mkdirSync(lockDir, { recursive: true });
	// create exclusive lock file. throws if exists.
	return fs.openSync(lockFile, 'wx');
}

function releaseLock(fd: number) {
	try {
		fs.closeSync(fd);
	} catch {}
	try {
		fs.unlinkSync(lockFile);
	} catch {}
}

function ensureNextSync() {
  console.log('🔄 Running ensureNextSync...');
  const series = db.select().from(expenseSeries).where(eq(expenseSeries.status, SeriesStatus.Active)).all();
  console.log(`📊 Found ${series.length} active series`);

  const today = ymdTodayUTC();

  for (const tpl of series) {
    console.log(`➡️ Series ${tpl.id} (${tpl.name ?? 'unnamed'})`);
    if (!tpl.nextDate) { console.log('   ⏭️ Skipping — no nextDate'); continue; }

    try {
      db.transaction((tx) => {
        const hardCap = 2000;
        let created = 0;

        // 1) Backfill past due rows until current > today (inclusive of today)
        if (tpl.rrule && tpl.rrule.trim().length) {
          const dueDates = occurrencesBetween(tpl as any, tpl.nextDate!, today);
          for (const d of dueDates) {
            const exists = tx.select({ id: expenseHistory.id })
              .from(expenseHistory)
              .where(and(eq(expenseHistory.seriesId, tpl.id), eq(expenseHistory.expenseDate, d)))
              .limit(1).all();
            if (!exists.length) {
              tx.insert(expenseHistory).values({
                seriesId: tpl.id,
                name: tpl.name ?? 'unnamed',
                provider: tpl.provider ?? null,
                type: tpl.type ?? null,
                paymentMethod: tpl.paymentMethod ?? null,
                amountCents: tpl.amountCents ?? null,
                frequencyInterval: tpl.frequencyInterval,
                frequencyUnit: tpl.frequencyUnit,
                expenseDate: d,
                status: 'pending',
              }).run?.();
              created++; console.log(`   ➕ Backfilled ${d}`);
              if (created > hardCap) throw new Error('hardCap reached; check recurrence');
            } else {
              console.log(`   ↪︎ Exists ${d}, skip`);
            }
          }
        } else {
          let current = tpl.nextDate!;
          while (current <= today) {
            const exists = tx.select({ id: expenseHistory.id })
              .from(expenseHistory)
              .where(and(eq(expenseHistory.seriesId, tpl.id), eq(expenseHistory.expenseDate, current)))
              .limit(1).all();
            if (!exists.length) {
              tx.insert(expenseHistory).values({
                seriesId: tpl.id,
                name: tpl.name ?? 'unnamed',
                provider: tpl.provider ?? null,
                type: tpl.type ?? null,
                paymentMethod: tpl.paymentMethod ?? null,
                amountCents: tpl.amountCents ?? null,
                frequencyInterval: tpl.frequencyInterval,
                frequencyUnit: tpl.frequencyUnit,
                expenseDate: current,
                status: 'pending',
              }).run?.();
              created++; console.log(`   ➕ Backfilled ${current}`);
            } else {
              console.log(`   ↪︎ Exists ${current}, skip`);
            }
            current = addInterval(current, tpl.frequencyInterval, tpl.frequencyUnit);
            if (created > hardCap) throw new Error('hardCap reached; check recurrence');
          }
        }

        // 2) Ensure exactly ONE future row (keep earliest existing, else plan the desired next)
        const futureRows = tx.select({ id: expenseHistory.id, expenseDate: expenseHistory.expenseDate })
          .from(expenseHistory)
          .where(and(eq(expenseHistory.seriesId, tpl.id), gt(expenseHistory.expenseDate, today)))
          .orderBy(expenseHistory.expenseDate)
          .all();

        let current: string;
        if (!futureRows.length) {
          const desired = tpl.rrule && tpl.rrule.trim().length
            ? nextAfter(tpl as any, today)
            : addInterval(today, tpl.frequencyInterval, tpl.frequencyUnit);
          if (!desired) throw new Error('Failed to compute next occurrence');
          tx.insert(expenseHistory).values({
            seriesId: tpl.id,
            name: tpl.name ?? 'unnamed',
            provider: tpl.provider ?? null,
            type: tpl.type ?? null,
            paymentMethod: tpl.paymentMethod ?? null,
            amountCents: tpl.amountCents ?? null,
            frequencyInterval: tpl.frequencyInterval,
            frequencyUnit: tpl.frequencyUnit,
            expenseDate: desired,
            status: 'pending',
          }).run?.();
          console.log(`   ➕ Planned future ${desired}`);
          current = desired;
        } else {
          const keep = futureRows[0].expenseDate; // earliest future
          const extras = futureRows.slice(1);
          if (extras.length) {
            tx.delete(expenseHistory)
              .where(and(
                eq(expenseHistory.seriesId, tpl.id),
                gt(expenseHistory.expenseDate, keep)
              ))
              .run?.();
            console.log(`   🧹 Pruned ${extras.length} extra future row(s) after ${keep}`);
          }
          current = keep;
        }

        // 3) Sync series.nextDate to that single future row
        if (tpl.nextDate !== current) {
          tx.update(expenseSeries)
            .set({ nextDate: current, updatedAt: new Date().toISOString() })
            .where(eq(expenseSeries.id, tpl.id))
            .run?.();
          console.log(`   🔁 series.nextDate → ${current}`);
        } else {
          console.log(`   ✅ series.nextDate already ${current}`);
        }
      });
    } catch (err) {
      console.error(`   ❌ Error for series ${tpl.id}:`, err);
      throw err;
    }
  }

  console.log('🏁 Finished ensureNextSync');
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
