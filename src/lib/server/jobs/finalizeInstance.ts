import { db } from '$lib/server/db/client';
import { expenseInstances, expenseTemplates } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { addMonths, addWeeks, addDays, formatISO, parseISO } from 'date-fns';

function advance(iso: string, n: number, unit: string) {
  const d = parseISO(iso);
  if (unit === 'month') return formatISO(addMonths(d, n), { representation: 'date' });
  if (unit === 'week') return formatISO(addWeeks(d, n), { representation: 'date' });
  return formatISO(addDays(d, n), { representation: 'date' });
}

export async function finalizeInstance(instanceId: number, outcome: 'verified' | 'skipped' | 'cancelled', opts = {}) {
  await db.transaction(async (tx) => {
    const [inst] = await tx.select().from(expenseInstances).where(eq(expenseInstances.id, instanceId)).limit(1);
    if (!inst) throw new Error('instance not found');

    if (inst.status !== 'pending' && inst.status !== 'posted') return;

    await tx.update(expenseInstances).set({
      status: outcome,
      finalizedAt: new Date().toISOString(),
      ...opts
    }).where(eq(expenseInstances.id, instanceId));

    const [tpl] = await tx.select().from(expenseTemplates).where(eq(expenseTemplates.id, inst.templateId)).limit(1);
    if (!tpl) return;
    if (tpl.status !== 'active') return;

    const nextDate = advance(inst.expectedDate, tpl.frequencyInterval, tpl.frequencyUnit);
    await tx.update(expenseTemplates).set({ nextDate, updatedAt: new Date().toISOString() }).where(eq(expenseTemplates.id, tpl.id));

    // ensure the next instance exists
    const existing = await tx.select().from(expenseInstances)
      .where(eq(expenseInstances.expectedDate, nextDate))
      .where(eq(expenseInstances.templateId, tpl.id)).limit(1);

    if (!existing.length) {
      await tx.insert(expenseInstances).values({
        templateId: tpl.id,
        expectedDate: nextDate,
        amountCents: tpl.amountCents,
        status: 'pending'
      });
    }
  });
}
