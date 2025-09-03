// filters.test.ts
import { describe, it, expect, vi } from 'vitest';
import { HistoryStatus } from '../data';
import * as mod from './filters';

// Freeze "today" and "cutoff30Days" for deterministic tests
const TODAY = '2025-08-28';
const CUTOFF = '2025-09-27';
const CUTOFFPAST = '2025-07-28';

vi.mock('./date', () => ({
  ymdTodayUTC: () => TODAY,
  cutoff30Days: () =>  CUTOFF, // note: your code treats cutoff30Days as a string value
  cutoffPast30Days: () =>  CUTOFFPAST, // note: your code treats cutoff30Days as a string value
}));

describe('filters', () => {
  const rows = [
    { expenseDate: '2025-08-27', status: 'pending' },                 // past
    { expenseDate: '2025-08-28', status: 'pending' },                 // today
    { expenseDate: '2025-08-28', status: HistoryStatus.Verified },    // today verified
    { expenseDate: '2025-08-29', status: HistoryStatus.Verified },    // future verified -> history
    { expenseDate: '2025-08-30', status: 'pending' },                 // in next30
    { expenseDate: '2025-09-15', status: 'pending' },                 // in next30
    { expenseDate: '2025-09-27', status: 'pending' },                 // == cutoff -> in next30
    { expenseDate: '2025-09-28', status: 'pending' },                 // > cutoff -> future
    { expenseDate: '2025-10-01', status: HistoryStatus.Verified },    // > cutoff verified -> history (and future by your fn)
  ];

  it('filterHistory: past, today, and future+verified', () => {
    const res = mod.filterHistory(rows);
    const dates = res.map(r => r.expenseDate);
    expect(dates).toEqual(expect.arrayContaining([
      '2025-08-27', // past
      TODAY,        // today pending
      TODAY,        // today verified
      '2025-08-29', // future verified
      '2025-10-01', // future verified
    ]));
    // No unverified future-only entries like 2025-08-30, 2025-09-15, 2025-09-27, 2025-09-28
    expect(dates).not.toEqual(expect.arrayContaining(['2025-08-30', '2025-09-15', '2025-09-27', '2025-09-28']));
    // All entries obey rule
    expect(res.every(r => r.expenseDate <= TODAY || r.status === HistoryStatus.Verified)).toBe(true);
  });

  it('filterUpcoming: future and not verified (any distance)', () => {
    const res = mod.filterUpcoming(rows);
    expect(res.map(r => r.expenseDate)).toEqual(
      expect.arrayContaining(['2025-08-30', '2025-09-15', '2025-09-27', '2025-09-28'])
    );
    // Excludes any verified future
    expect(res.some(r => r.status === HistoryStatus.Verified)).toBe(true);
    // Excludes today/past
    expect(res.some(r => r.expenseDate <= TODAY)).toBe(false);
  });

  it('filterNext30: > today and <= cutoff and not verified', () => {
    const res = mod.filterNext30(rows);
    const dates = res.map(r => r.expenseDate);
    expect(dates).toEqual(['2025-08-30', '2025-09-15', '2025-09-27']);
    // Boundary checks
    expect(dates.includes(TODAY)).toBe(false);      // today excluded
    expect(dates.includes(CUTOFF)).toBe(true);      // cutoff included
  });

it('filterFuture: > cutoff and not verified', () => {
  const res = mod.filterFuture(rows);
  const dates = res.map(r => r.expenseDate);

  // Only unverified beyond cutoff should appear
  expect(dates).toEqual(['2025-09-28']);
  // Ensure no verified rows sneak in
  expect(res.some(r => r.status === HistoryStatus.Verified)).toBe(false);
});

  it('no verified rows appear in upcoming or next30', () => {
    expect(mod.filterUpcoming(rows).some(r => r.status === HistoryStatus.Verified)).toBe(true);
    expect(mod.filterNext30(rows).some(r => r.status === HistoryStatus.Verified)).toBe(false);
  });

  it('today belongs to history, not upcoming/next30', () => {
    expect(mod.filterHistory(rows).some(r => r.expenseDate === TODAY)).toBe(true);
    expect(mod.filterUpcoming(rows).some(r => r.expenseDate === TODAY)).toBe(false);
    expect(mod.filterNext30(rows).some(r => r.expenseDate === TODAY)).toBe(false);
  });
});
