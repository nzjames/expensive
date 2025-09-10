import { db } from '$lib/server/db/client';
import { tables, expenseSeries } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { buildRRuleString } from '$lib/server/recurrence';
import { z } from 'zod';
import {
  zUpdateRequest,
  validateSeriesUpdate,
  validateHistoryUpdate,
  SeriesUpdatableColumns,
  HistoryUpdatableColumns
} from '$lib/validation';

export const PUT: RequestHandler = async ({ request }) => {
  try {
    const raw = (await request.json().catch(() => ({}))) as unknown;
    const { table, id, column, value } = zUpdateRequest.parse(raw);

    if (!(table in tables)) {
      return new Response(JSON.stringify({ error: 'Invalid table' }), { status: 400 });
    }

    if (table === 'expenseSeries') {
      // Validate column + value
      const parsedValue = validateSeriesUpdate(column, value);

      // Keep RRULE in sync for cadence/anchor changes
      if (['frequencyInterval', 'frequencyUnit', 'nextDate'].includes(column)) {
        const row = (
          await db.select().from(expenseSeries).where(eq(expenseSeries.id, id)).limit(1)
        )[0];
        if (!row) return new Response(JSON.stringify({ error: 'Series not found' }), { status: 404 });

        const nextDate = (column === 'nextDate' ? parsedValue : row.nextDate) as string | null;
        const frequencyUnit = (column === 'frequencyUnit' ? parsedValue : row.frequencyUnit) as string;
        const frequencyInterval = (column === 'frequencyInterval' ? parsedValue : row.frequencyInterval) as number;
        const rule = nextDate ? buildRRuleString(nextDate, frequencyUnit, frequencyInterval) : null;

        await db
          .update(expenseSeries)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .set({ [column]: parsedValue as any, rrule: rule })
          .where(eq(expenseSeries.id, id));
      } else {
        await db
          .update(tables[table])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .set({ [column]: parsedValue as any })
          // @ts-expect-error dynamic key is fine
          .where(eq(tables[table].id, id));
      }
    } else if (table === 'expenseHistory') {
      const parsedValue = validateHistoryUpdate(column, value);
      await db
        .update(tables[table])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .set({ [column]: parsedValue as any })
        // @ts-expect-error dynamic key is fine
        .where(eq(tables[table].id, id));
    }

    return new Response(JSON.stringify({ success: true }));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Validation failed', issues: err.issues }), {
        status: 400
      });
    }
    console.error('PUT /api/update error', err);
    return new Response('Internal Server Error', { status: 500 });
  }
};
