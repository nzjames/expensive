import { json } from '@sveltejs/kit';
import { ymdTodayUTC, cutoff30Days } from '$lib/helpers/date';
import { GET as getOccurrences } from '../occurrences/+server';

export async function GET({ url, fetch, params, request, route, setHeaders, locals, platform }) {
  // Proxy to /api/occurrences with start=today and end=until
  const today = ymdTodayUTC();
  const until = url.searchParams.get('until') || cutoff30Days();

  // Build a new URLSearchParams preserving seriesId/include if present
  const qp = new URLSearchParams();
  qp.set('start', today);
  qp.set('end', until);
  const seriesId = url.searchParams.get('seriesId');
  if (seriesId) qp.set('seriesId', seriesId);
  const include = url.searchParams.get('include');
  if (include) qp.set('include', include); // defaults handled by occurrences

  // Create a faux event with the adjusted URL
  const newUrl = new URL(url);
  newUrl.search = qp.toString();

  return getOccurrences({ url: newUrl, fetch, params, request, route, setHeaders, locals, platform } as any);
}

