// rrule is published as CommonJS. In ESM/Vite SSR, use default import and destructure.
import rrulePkg from 'rrule';
const { RRule } = rrulePkg as any;

type SeriesLike = {
  id: number;
  nextDate: string | null;
  frequencyInterval: number;
  frequencyUnit: string; // 'week' | 'month' | 'year' | 'day'
  rrule?: string | null;
};

const toUTCDate = (ymd: string) => new Date(`${ymd}T00:00:00Z`);
const toYMD = (d: Date) => d.toISOString().slice(0, 10);

function daysInMonth(y: number, m /* 1-12 */: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function isLastDayOfMonth(ymd: string): boolean {
  const d = toUTCDate(ymd);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1; // 1-12
  const day = d.getUTCDate();
  return day === daysInMonth(y, m);
}

function weekdayToken(ymd: string): string {
  const weekday = toUTCDate(ymd).getUTCDay(); // 0=Sun
  return ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][weekday];
}

export function buildRRuleString(nextDate: string, unit: string, interval: number): string {
  const parts: string[] = [];
  const int = Math.max(1, Math.floor(interval || 1));
  const d = toUTCDate(nextDate);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1; // 1-12
  const monthDay = d.getUTCDate();

  switch (unit) {
    case 'week':
    case 'weeks': {
      const byday = weekdayToken(nextDate);
      parts.push('FREQ=WEEKLY');
      parts.push(`INTERVAL=${int}`);
      parts.push(`BYDAY=${byday}`);
      break;
    }
    case 'month':
    case 'months': {
      parts.push('FREQ=MONTHLY');
      parts.push(`INTERVAL=${int}`);
      if (isLastDayOfMonth(nextDate)) {
        // Last day-of-month clamping
        parts.push('BYMONTHDAY=28,29,30,31');
        parts.push('BYSETPOS=-1');
      } else {
        parts.push(`BYMONTHDAY=${monthDay}`);
      }
      break;
    }
    case 'year':
    case 'years': {
      parts.push('FREQ=YEARLY');
      parts.push(`INTERVAL=${int}`);
      parts.push(`BYMONTH=${m}`);
      if (isLastDayOfMonth(nextDate)) {
        // Last day-of-month for that specific month
        parts.push('BYMONTHDAY=28,29,30,31');
        parts.push('BYSETPOS=-1');
      } else {
        parts.push(`BYMONTHDAY=${monthDay}`);
      }
      break;
    }
    case 'day':
    case 'days':
    default: {
      parts.push('FREQ=DAILY');
      parts.push(`INTERVAL=${int}`);
      break;
    }
  }
  return parts.join(';');
}

export function rruleEngine(series: SeriesLike) {
  if (!series.nextDate) throw new Error('No nextDate/DTSTART for series');
  const dtstart = toUTCDate(series.nextDate);

  const ruleStr = series.rrule && series.rrule.trim().length
    ? series.rrule
    : buildRRuleString(series.nextDate, series.frequencyUnit, series.frequencyInterval);

  const opts = RRule.parseString(ruleStr);
  opts.dtstart = dtstart;
  return new RRule(opts);
}

export function occurrencesBetween(series: SeriesLike, startYmd: string, endYmd: string): string[] {
  if (!series.nextDate) return [];
  try {
    const r = rruleEngine(series);
    const list = r.between(toUTCDate(startYmd), toUTCDate(endYmd), true);
    return list.map(toYMD);
  } catch {
    // Fallback stepping if rrule fails for any reason.
    // Respect the series.nextDate as the DTSTART and walk forward.
    const out: string[] = [];
    const interval = Math.max(1, Math.floor(series.frequencyInterval || 1));
    const unit = series.frequencyUnit;

    let cur = series.nextDate;
    let guard = 0;
    while (cur < startYmd) {
      cur = addIntervalPlain(cur, interval, unit);
      guard++; if (guard > 10000) throw new Error('occurrencesBetween hardCap exceeded');
    }
    while (cur <= endYmd) {
      out.push(cur);
      cur = addIntervalPlain(cur, interval, unit);
      guard++; if (guard > 10000) throw new Error('occurrencesBetween hardCap exceeded');
    }
    return out;
  }
}

export function nextAfter(series: SeriesLike, fromYmd: string): string | null {
  if (!series.nextDate) return null;
  try {
    const r = rruleEngine(series);
    const n = r.after(toUTCDate(fromYmd), false);
    return n ? toYMD(n) : null;
  } catch {
    // Fallback stepping
    let cur = series.nextDate;
    while (cur && cur <= fromYmd) {
      cur = addIntervalPlain(cur, series.frequencyInterval, series.frequencyUnit);
    }
    return cur;
  }
}

// Minimal fallback stepping matching existing helper semantics
export function addIntervalPlain(dateStr: string, interval: number, unit: string): string {
  const d = toUTCDate(dateStr);
  switch (unit) {
    case 'week':
    case 'weeks':
      d.setUTCDate(d.getUTCDate() + interval * 7);
      break;
    case 'month':
    case 'months': {
      const day = d.getUTCDate();
      d.setUTCMonth(d.getUTCMonth() + interval);
      // handle clamping for months with fewer days
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth() + 1;
      const dim = daysInMonth(y, m);
      if (day > dim) d.setUTCDate(dim);
      break;
    }
    case 'year':
    case 'years': {
      const day = d.getUTCDate();
      d.setUTCFullYear(d.getUTCFullYear() + interval);
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth() + 1;
      const dim = daysInMonth(y, m);
      if (day > dim) d.setUTCDate(dim);
      break;
    }
    case 'day':
    case 'days':
    default:
      d.setUTCDate(d.getUTCDate() + interval);
      break;
  }
  return toYMD(d);
}
