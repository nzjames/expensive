import { db } from '$lib/server/db/client';
import { expenseSeries } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { validateSeriesUpdate } from '$lib/validation';

export async function PUT({ params, request }) {
  try {
    const id = z.coerce.number().int().positive().parse(params.id);
    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = z
      .object({ field: z.string().trim().min(1), value: z.unknown() })
      .parse(body);

    const val = validateSeriesUpdate(parsed.field, parsed.value);

    await db
      .update(expenseSeries)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set({ [parsed.field]: val as any })
      .where(eq(expenseSeries.id, id));

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Validation failed', issues: err.issues }), {
        status: 400
      });
    }
    console.error('PUT /api/series/[id] error', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
