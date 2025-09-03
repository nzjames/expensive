import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { expenseSeries } from '$lib/server/db/schema';
import { SeriesStatus, FrequencyUnit } from '$lib/data';
import { ymdTodayUTC } from '../../../lib/helpers/date.js';
import { eq } from 'drizzle-orm';

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
  const body = await request.json().catch(() => ({}));
  const today = ymdTodayUTC();

  // Safe defaults to satisfy NOT NULL constraints
  const values = {
    name: body.name ?? 'New series',
    status: body.status ?? SeriesStatus.Active,
    frequencyInterval: body.frequencyInterval ?? 1,
    frequencyUnit: body.frequencyUnit ?? FrequencyUnit.Month,
    amountCents: body.amountCents ?? 0,
    provider: body.provider ?? null,
    type: body.type ?? null,
    paymentMethod: body.paymentMethod ?? null,
    nextDate: body.nextDate ?? today
  };

  // better-sqlite3 via drizzle returns lastInsertRowid on .run()
  const res: any = db.insert(expenseSeries).values(values).run?.() ?? await db.insert(expenseSeries).values(values).returning({ id: expenseSeries.id });
  const id = typeof res?.lastInsertRowid !== 'undefined' ? Number(res.lastInsertRowid) : Number(res?.[0]?.id);

  const created = (await db.select().from(expenseSeries).where(eq(expenseSeries.id, id)).limit(1))[0];
  return json(created, { status: 201 });
}

// DELETE (used if user cancels a just-created blank row)
export async function DELETE({ url }) {
  const id = Number(url.searchParams.get('id'));
  if (!id) return json({ error: 'id required' }, { status: 400 });
  await (db.delete(expenseSeries).where(eq(expenseSeries.id, id)).run?.() ?? db.delete(expenseSeries).where(eq(expenseSeries.id, id)));
  return json({ ok: true });
}