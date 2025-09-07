#!/usr/bin/env node
import { db } from '../../db/client';
import { expenseSeries } from '../../db/schema';
import { buildRRuleString } from '../../recurrence';
import { eq } from 'drizzle-orm';

const args = process.argv.slice(2);
const dry = args.includes('--dry') || args.includes('--dry-run');

function main() {
  console.log(`populate-rrule: starting (${dry ? 'dry-run' : 'apply'})`);
  const series = db.select().from(expenseSeries).all();
  let updated = 0;

  db.transaction((tx) => {
    for (const s of series) {
      if (!s.nextDate) { console.log(` - series ${s.id}: skip (no nextDate)`); continue; }
      const rule = buildRRuleString(s.nextDate, s.frequencyUnit, s.frequencyInterval);
      if (s.rrule === rule) { console.log(` - series ${s.id}: unchanged`); continue; }
      console.log(` - series ${s.id}: ${s.rrule ?? '(none)'} -> ${rule}`);
      updated++;
      if (!dry) {
        tx.update(expenseSeries).set({ rrule: rule, updatedAt: new Date().toISOString() }).where(eq(expenseSeries.id, s.id)).run?.();
      }
    }
  });

  console.log(`populate-rrule: done (${updated} ${dry ? 'would update' : 'updated'})`);
}

main();

