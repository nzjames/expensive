import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { expenseSeries, expenseHistory } from '$lib/server/db/schema';
import { SeriesStatus } from '$lib/data';
import { and, eq, inArray, gte, lte } from 'drizzle-orm';
import { ymdTodayUTC, cutoff30Days } from '$lib/helpers/date';
import { occurrencesBetween } from '$lib/server/recurrence';
import { z } from 'zod';
import { zOccurrencesQuery } from '$lib/validation';

type Instance = {
  source: 'history' | 'projection';
  id?: number; // history id
  seriesId: number;
  expenseDate: string;
  name: string;
  provider: string | null;
  type: string | null;
  paymentMethod: string | null;
  amountCents: number;
  frequencyInterval: number;
  frequencyUnit: string;
  status?: string; // history only
  projectedStatus?: 'projected'; // projection only
};

export async function GET({ url }) {
  try {
    const today = ymdTodayUTC();
    const qp = zOccurrencesQuery.parse({
      start: url.searchParams.get('start') ?? undefined,
      end: url.searchParams.get('end') ?? undefined,
      include: url.searchParams.get('include') ?? undefined,
      seriesId: url.searchParams.get('seriesId') ?? undefined
    });

    const start = qp.start || today;
    const end = qp.end || cutoff30Days();
    const includeHistory = qp.include.includes('history');
    const includeProjection = qp.include.includes('projection');
    const seriesIds = qp.seriesId && qp.seriesId.length ? qp.seriesId : null;

  // Series to consider for projections (active only)
  const seriesWhere = seriesIds
    ? and(inArray(expenseSeries.id, seriesIds), eq(expenseSeries.status, SeriesStatus.Active))
    : eq(expenseSeries.status, SeriesStatus.Active);
  const series = await db.select().from(expenseSeries).where(seriesWhere);

  const results: Instance[] = [];

  // Persisted history within [start, end] for selected series (if requested)
  let seen = new Set<string>();
  if (includeHistory) {
    const historyWhere = seriesIds
      ? and(inArray(expenseHistory.seriesId, seriesIds), gte(expenseHistory.expenseDate, start), lte(expenseHistory.expenseDate, end))
      : and(gte(expenseHistory.expenseDate, start), lte(expenseHistory.expenseDate, end));

    const hist = await db.select().from(expenseHistory).where(historyWhere);
    for (const h of hist) {
      const item: Instance = {
        source: 'history',
        id: h.id!,
        seriesId: h.seriesId!,
        expenseDate: h.expenseDate!,
        name: h.name!,
        provider: h.provider ?? null,
        type: h.type ?? null,
        paymentMethod: h.paymentMethod ?? null,
        amountCents: h.amountCents!,
        frequencyInterval: h.frequencyInterval!,
        frequencyUnit: h.frequencyUnit!,
        status: h.status ?? 'pending',
      };
      results.push(item);
      seen.add(`${h.seriesId}|${h.expenseDate}`);
    }
  }

  // Projections for active series (if requested)
  if (includeProjection) {
    // Find the most recent persisted history date for each series up to `end`
    const activeIds = series.map((s) => Number(s.id)).filter((n) => Number.isFinite(n));
    const histForBaseline = activeIds.length
      ? await db
          .select({ seriesId: expenseHistory.seriesId, expenseDate: expenseHistory.expenseDate })
          .from(expenseHistory)
          .where(and(inArray(expenseHistory.seriesId, activeIds), lte(expenseHistory.expenseDate, end)))
      : [];

    const lastBySeries = new Map<number, string>();
    for (const h of histForBaseline) {
      const sid = Number(h.seriesId);
      const cur = lastBySeries.get(sid);
      if (!cur || (h.expenseDate as string) > cur) lastBySeries.set(sid, h.expenseDate as string);
    }

    for (const s of series) {
      if (!s.nextDate) continue;
      // Only project after the most recent persisted history (up to `end`),
      // and never before `start`
      const baselineCandidate = lastBySeries.get(Number(s.id)) || start;
      const baseline = baselineCandidate > start ? baselineCandidate : start;
      const occ = occurrencesBetween(s as any, baseline, end);
      for (const d of occ) {
        const key = `${s.id}|${d}`;
        if (seen.has(key)) continue; // prefer history if exists
        results.push({
          source: 'projection',
          seriesId: s.id!,
          expenseDate: d,
          name: s.name ?? 'unnamed',
          provider: s.provider ?? null,
          type: s.type ?? null,
          paymentMethod: s.paymentMethod ?? null,
          amountCents: s.amountCents ?? 0,
          frequencyInterval: s.frequencyInterval!,
          frequencyUnit: s.frequencyUnit!,
          projectedStatus: 'projected',
        });
      }
    }
  }

  results.sort((a, b) => a.expenseDate.localeCompare(b.expenseDate));
    return json(results);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Invalid query params', issues: err.issues }), {
        status: 400
      });
    }
    console.error('GET /api/occurrences error', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
