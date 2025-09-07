import { describe, it, expect } from 'vitest';
import { occurrencesBetween, buildRRuleString} from './recurrence';

describe('recurrence.occurrencesBetween', () => {
  it('returns no occurrences before DTSTART for multi-month intervals', () => {
    const series = {
      id: 1,
      nextDate: '2025-12-10',
      frequencyInterval: 3,
      frequencyUnit: 'month',
      rrule: buildRRuleString('2025-12-10', 'month', 3),
    } as const;

    const list = occurrencesBetween(series as any, '2025-09-06', '2025-10-06');
    expect(list).toEqual([]);
  });

  it('includes occurrences aligned to DTSTART for monthly', () => {
    const series = {
      id: 2,
      nextDate: '2025-09-10',
      frequencyInterval: 1,
      frequencyUnit: 'month',
      rrule: buildRRuleString('2025-09-10', 'month', 1),
    } as const;

    const list = occurrencesBetween(series as any, '2025-09-06', '2025-10-06');
    expect(list).toEqual(['2025-09-10']);
  });

  it('returns no occurrences before DTSTART for yearly', () => {
    const series = {
      id: 3,
      nextDate: '2025-12-01',
      frequencyInterval: 1,
      frequencyUnit: 'year',
      rrule: buildRRuleString('2025-12-01', 'year', 1),
    } as const;

    const list = occurrencesBetween(series as any, '2025-09-06', '2025-10-06');
    expect(list).toEqual([]);
  });
});

