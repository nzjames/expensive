export function addInterval(dateStr: string|null, interval: number, unit: string): string {
    if (dateStr === null) {
      throw new Error(`No date provided`);
    }
  
    const d = new Date(dateStr);

  switch (unit) {
    case "day":
    case "days":
      d.setDate(d.getDate() + interval);
      break;
    case "week":
    case "weeks":
      d.setDate(d.getDate() + interval * 7);
      break;
    case "month":
    case "months":
      d.setMonth(d.getMonth() + interval);
      break;
    case "year":
    case "years":
      d.setFullYear(d.getFullYear() + interval);
      break;
    default:
      throw new Error(`Unsupported frequency unit: ${unit}`);
  }

  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export function ymdTodayUTC(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}
const in30days = new Date();
in30days.setDate(in30days.getDate() + 30);

export const cutoff30Days = in30days.toISOString().slice(0, 10);