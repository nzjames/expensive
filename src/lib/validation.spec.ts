import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  zExpenseSeriesCreateInput,
  validateSeriesUpdate,
  validateHistoryUpdate,
  zOccurrencesQuery
} from './validation';

describe('validation schemas', () => {
  it('series create: fills defaults and coerces', () => {
    const parsed = zExpenseSeriesCreateInput.parse({ name: 'Test', amountCents: '123', frequencyInterval: '2' });
    expect(parsed.status).toBeDefined();
    expect(parsed.frequencyUnit).toBeDefined();
    expect(parsed.amountCents).toBe(123);
    expect(parsed.frequencyInterval).toBe(2);
  });

  it('series update: rejects unknown column', () => {
    expect(() => validateSeriesUpdate('id' as any, 1)).toThrow(z.ZodError);
  });

  it('series update: coerce numeric values', () => {
    expect(validateSeriesUpdate('amountCents', '250')).toBe(250);
    expect(validateSeriesUpdate('frequencyInterval', '3')).toBe(3);
  });

  it('history update: status enum enforced', () => {
    expect(validateHistoryUpdate('status', 'pending')).toBe('pending');
    expect(() => validateHistoryUpdate('status', 'foo')).toThrow(z.ZodError);
  });

  it('dates: iso and empty-to-null', () => {
    expect(validateSeriesUpdate('nextDate', '2025-01-02')).toBe('2025-01-02');
    expect(validateSeriesUpdate('nextDate', '')).toBeNull();
    expect(() => validateSeriesUpdate('nextDate', '02/01/2025')).toThrow(z.ZodError);
  });

  it('occurrences query: transforms include and seriesId', () => {
    const q = zOccurrencesQuery.parse({ start: '2025-01-01', end: '2025-02-01', include: 'History,Projection', seriesId: '1, x, 2' });
    expect(q.include).toContain('history');
    expect(q.include).toContain('projection');
    expect(q.seriesId).toEqual([1, 2]);
  });
});

