export function addInterval(dateStr: string | null, interval: number, unit: string): string {
	if (dateStr === null) {
		throw new Error(`No date provided`);
	}

	const d = new Date(dateStr);

	switch (unit) {
		case 'day':
		case 'days':
			d.setDate(d.getDate() + interval);
			break;
		case 'week':
		case 'weeks':
			d.setDate(d.getDate() + interval * 7);
			break;
		case 'month':
		case 'months':
			d.setMonth(d.getMonth() + interval);
			break;
		case 'year':
		case 'years':
			d.setFullYear(d.getFullYear() + interval);
			break;
		default:
			throw new Error(`Unsupported frequency unit: ${unit}`);
	}

	return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export function ymdTodayUTC(): string {
	return ymd(new Date());
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);

export function cutoffDays(deltaDays: number, base: Date = new Date()): string {
  const d = new Date(Date.UTC(
    base.getUTCFullYear(),
    base.getUTCMonth(),
    base.getUTCDate()
  ));
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return ymd(d);
}

export const cutoff30Days      = (base?: Date) => cutoffDays( 30, base);
export const cutoffPast30Days  = (base?: Date) => cutoffDays(-30, base);
