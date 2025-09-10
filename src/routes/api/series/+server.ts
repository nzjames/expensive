import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { expenseSeries } from '$lib/server/db/schema';
import { SeriesStatus, FrequencyUnit } from '$lib/data';
import { ymdTodayUTC } from '$lib/helpers/date.js';
import { buildRRuleString } from '$lib/server/recurrence';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  zExpenseSeriesCreateInput,
  validateSeriesUpdate,
  SeriesUpdatableColumns
} from '$lib/validation';

export async function GET() {
	try {
		const data = await db.select().from(expenseSeries);
		return json(data);
	} catch (err) {
		console.error('Error fetching expenses:', err);
		return new Response('Internal Server Error', { status: 500 });
	}
}

// CREATE
export async function POST({ request }) {
  try {
    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = zExpenseSeriesCreateInput.parse(body);
    const today = ymdTodayUTC();

    const values = {
      name: parsed.name,
      status: parsed.status ?? SeriesStatus.Active,
      frequencyInterval: parsed.frequencyInterval ?? 1,
      frequencyUnit: parsed.frequencyUnit ?? FrequencyUnit.Month,
      amountCents: parsed.amountCents ?? 0,
      provider: parsed.provider ?? null,
      type: parsed.type ?? null,
      paymentMethod: parsed.paymentMethod ?? null,
      contactEmail: parsed.contactEmail ?? null,
      portalUrl: parsed.portalUrl ?? null,
      nextDate: parsed.nextDate ?? today,
      renewalDate: parsed.renewalDate ?? null,
      verifiedDate: parsed.verifiedDate ?? null
    } as Record<string, any>;

    if (values.nextDate) {
      values.rrule = buildRRuleString(values.nextDate, values.frequencyUnit, values.frequencyInterval);
    }

    const res: any =
      db.insert(expenseSeries).values(values).run?.() ??
      (await db.insert(expenseSeries).values(values).returning({ id: expenseSeries.id }));
    const id =
      typeof res?.lastInsertRowid !== 'undefined'
        ? Number(res.lastInsertRowid)
        : Number(res?.[0]?.id);

    const created = (
      await db.select().from(expenseSeries).where(eq(expenseSeries.id, id)).limit(1)
    )[0];
    return json(created, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Validation failed', issues: err.issues }), {
        status: 400
      });
    }
    console.error('POST /api/series error', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// DELETE (used if user cancels a just-created blank row)
export async function DELETE({ url }) {
  try {
    const idRaw = url.searchParams.get('id');
    const id = z.coerce.number().int().positive().parse(idRaw);
    await (
      db.delete(expenseSeries).where(eq(expenseSeries.id, id)).run?.() ??
      db.delete(expenseSeries).where(eq(expenseSeries.id, id))
    );
    return json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return json({ error: 'Invalid id' }, { status: 400 });
    }
    console.error('DELETE /api/series error', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
