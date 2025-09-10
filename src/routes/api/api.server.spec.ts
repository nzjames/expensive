import { describe, it, expect } from 'vitest';
import { db } from '$lib/server/db/client';
import { expenseSeries } from '$lib/server/db/schema';
import { GET as getOccurrences } from './occurrences/+server';
import { POST as postSeries } from './series/+server';
import { PUT as putUpdate } from './update/+server';
import { eq } from 'drizzle-orm';

function jsonRequest(url: string, method: string, body: unknown) {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}

describe('API (server) — series + update + occurrences', () => {
  it('POST /api/series creates with defaults/coercion and computes rrule', async () => {
    const payload = {
      name: 'Test Series',
      amountCents: '1500',
      frequencyInterval: '2',
      frequencyUnit: 'month',
      nextDate: '2025-09-02'
    };

    const res = await postSeries({ request: jsonRequest('http://local/api/series', 'POST', payload) } as any);
    expect(res.status).toBe(201);
    const created = await res.json();
    expect(created).toHaveProperty('id');
    expect(created.name).toBe('Test Series');
    expect(created.amountCents).toBe(1500);
    expect(created.frequencyInterval).toBe(2);
    expect(created.frequencyUnit).toBe('month');
    expect(typeof created.rrule).toBe('string');
    expect(created.rrule).toContain('FREQ=MONTHLY');
    expect(created.rrule).toContain('INTERVAL=2');
  });

  it('PUT /api/update enforces column whitelist and recomputes rrule for cadence changes', async () => {
    // insert a simple series row via POST first
    const payload = {
      name: 'Update Target',
      amountCents: 1000,
      frequencyInterval: 1,
      frequencyUnit: 'month',
      nextDate: '2025-09-02'
    };
    const createRes = await postSeries({ request: jsonRequest('http://local/api/series', 'POST', payload) } as any);
    const created = await createRes.json();
    const id = Number(created.id);

    // update frequencyInterval -> '3' (string), should coerce and recompute rrule
    const okUpdate = await putUpdate({
      request: jsonRequest('http://local/api/update', 'PUT', {
        table: 'expenseSeries',
        id,
        column: 'frequencyInterval',
        value: '3'
      })
    } as any);
    expect(okUpdate.status).toBe(200);

    // verify DB reflects the change and rrule contains INTERVAL=3
    const row = (await db.select().from(expenseSeries).where(eq(expenseSeries.id, id)).limit(1))[0];
    expect(row.frequencyInterval).toBe(3);
    expect(String(row.rrule)).toContain('INTERVAL=3');

    // attempt to update disallowed column
    const badUpdate = await putUpdate({
      request: jsonRequest('http://local/api/update', 'PUT', {
        table: 'expenseSeries',
        id,
        column: 'rrule',
        value: 'FREQ=DAILY;INTERVAL=1'
      })
    } as any);
    expect(badUpdate.status).toBe(400);
    const err = await badUpdate.json();
    expect(err).toHaveProperty('error');
  });

  it('GET /api/occurrences validates query and returns projections', async () => {
    // create a series that will project within the window
    const payload = {
      name: 'Proj Series',
      amountCents: 500,
      frequencyInterval: 1,
      frequencyUnit: 'month',
      nextDate: '2025-09-02'
    };
    const createRes = await postSeries({ request: jsonRequest('http://local/api/series', 'POST', payload) } as any);
    const created = await createRes.json();
    const id = Number(created.id);

    // invalid start date -> 400
    const bad = await getOccurrences({ url: new URL('http://local/api/occurrences?start=2025-13-01') } as any);
    expect(bad.status).toBe(400);

    // valid window including nextDate, projection-only, scoped to seriesId
    const url = new URL('http://local/api/occurrences');
    url.searchParams.set('start', '2025-09-01');
    url.searchParams.set('end', '2025-10-30');
    url.searchParams.set('include', 'projection');
    url.searchParams.set('seriesId', String(id));
    const ok = await getOccurrences({ url } as any);
    expect(ok.status).toBe(200);
    const items = await ok.json();
    expect(Array.isArray(items)).toBe(true);
    // should include at least the nextDate projection
    expect(items.some((i: any) => i.seriesId === id && i.source === 'projection')).toBe(true);
  });
});
