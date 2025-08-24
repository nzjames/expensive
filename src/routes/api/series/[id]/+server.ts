import { db } from '$lib/server/db/client';
import { expenseSeries } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT({ params, request }) {
  const id = Number(params.id);
  const { field, value } = await request.json();

  if (!field) {
    return new Response(JSON.stringify({ error: 'Missing field name' }), { status: 400 });
  }

  await db.update(expenseSeries)
    .set({ [field]: value })
    .where(eq(expenseSeries.id, id));

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}