import { db } from '$lib/server/db/client';
import { tables, expenseSeries } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { buildRRuleString } from '$lib/server/recurrence';

export const PUT: RequestHandler = async ({ request }) => {
	const { table, id, column, value } = await request.json();

	// Validate table exists
	if (!(table in tables)) {
		return new Response(JSON.stringify({ error: 'Invalid table' }), { status: 400 });
	}

  // Special handling: keep expenseSeries.rrule in sync when cadence/anchor changes
  if (table === 'expenseSeries' && (column === 'frequencyInterval' || column === 'frequencyUnit' || column === 'nextDate')) {
    const row = (await db.select().from(expenseSeries).where(eq(expenseSeries.id, id)).limit(1))[0];
    if (!row) return new Response(JSON.stringify({ error: 'Series not found' }), { status: 404 });

    const nextDate = (column === 'nextDate' ? value : row.nextDate) as string | null;
    const frequencyUnit = (column === 'frequencyUnit' ? value : row.frequencyUnit) as string;
    const frequencyInterval = (column === 'frequencyInterval' ? Number(value) : row.frequencyInterval) as number;

    const rule = nextDate ? buildRRuleString(nextDate, frequencyUnit, frequencyInterval) : null;

    await db
      .update(expenseSeries)
      .set({ [column]: value, rrule: rule })
      .where(eq(expenseSeries.id, id));
  } else {
    // Generic update
    await db
      .update(tables[table as keyof typeof tables])
      .set({ [column]: value })
      .where(eq(tables[table as keyof typeof tables].id, id));
  }

	return new Response(JSON.stringify({ success: true }));
};
