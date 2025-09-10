import { z } from 'zod';
import { SeriesStatus, FrequencyUnit, HistoryStatus } from '$lib/data';

// Common primitives
function isValidIsoDate(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(iso);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12) return false;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === mo - 1 &&
    dt.getUTCDate() === d
  );
}

export const zISODate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, 'Expected YYYY-MM-DD')
  .refine(isValidIsoDate, 'Invalid calendar date');

export const zISODateOrNull = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  zISODate.nullable()
);

export const zNullableString = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z.string().trim().min(1).nullable()
);

export const zSeriesStatus = z.nativeEnum(SeriesStatus);
export const zHistoryStatus = z.nativeEnum(HistoryStatus);
export const zFrequencyUnit = z.nativeEnum(FrequencyUnit);

// Create payload for expenseSeries (fields you accept from client)
export const zExpenseSeriesCreateInput = z.object({
  name: z.string().trim().min(1).default('New series'),
  provider: zNullableString.optional(),
  type: zNullableString.optional(),
  status: zSeriesStatus.default(SeriesStatus.Active),
  frequencyInterval: z.coerce.number().int().min(1).default(1),
  frequencyUnit: zFrequencyUnit.default(FrequencyUnit.Month),
  paymentMethod: zNullableString.optional(),
  amountCents: z.coerce.number().int().min(0).default(0),
  contactEmail: zNullableString.optional(),
  portalUrl: zNullableString.optional(),
  nextDate: zISODateOrNull.optional(),
  renewalDate: zISODateOrNull.optional(),
  verifiedDate: zISODateOrNull.optional()
});

// Per-column validators for dynamic updates
export const SeriesUpdateValidators = {
  name: z.string().trim().min(1),
  provider: zNullableString,
  type: zNullableString,
  status: zSeriesStatus,
  frequencyInterval: z.coerce.number().int().min(1),
  frequencyUnit: zFrequencyUnit,
  paymentMethod: zNullableString,
  amountCents: z.coerce.number().int().min(0),
  contactEmail: zNullableString,
  portalUrl: zNullableString,
  nextDate: zISODateOrNull,
  renewalDate: zISODateOrNull,
  verifiedDate: zISODateOrNull
} as const;

export type SeriesUpdatableColumn = keyof typeof SeriesUpdateValidators;
export const SeriesUpdatableColumns = Object.keys(SeriesUpdateValidators) as SeriesUpdatableColumn[];

export const HistoryUpdateValidators = {
  name: z.string().trim().min(1),
  provider: zNullableString,
  type: zNullableString,
  paymentMethod: zNullableString,
  amountCents: z.coerce.number().int().min(0),
  frequencyInterval: z.coerce.number().int().min(1),
  frequencyUnit: zFrequencyUnit,
  expenseDate: zISODate,
  actualDate: zISODateOrNull,
  status: zHistoryStatus,
  note: zNullableString
} as const;

export type HistoryUpdatableColumn = keyof typeof HistoryUpdateValidators;
export const HistoryUpdatableColumns = Object.keys(HistoryUpdateValidators) as HistoryUpdatableColumn[];

export const zUpdateRequest = z.object({
  table: z.enum(['expenseSeries', 'expenseHistory']),
  id: z.coerce.number().int().positive(),
  column: z.string().trim().min(1),
  value: z.unknown()
});

export function validateSeriesUpdate(column: string, value: unknown) {
  if (!SeriesUpdatableColumns.includes(column as SeriesUpdatableColumn)) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        message: `Invalid column for expenseSeries: ${column}`,
        path: ['column']
      }
    ]);
  }
  const schema = SeriesUpdateValidators[column as SeriesUpdatableColumn];
  return schema.parse(value);
}

export function validateHistoryUpdate(column: string, value: unknown) {
  if (!HistoryUpdatableColumns.includes(column as HistoryUpdatableColumn)) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        message: `Invalid column for expenseHistory: ${column}`,
        path: ['column']
      }
    ]);
  }
  const schema = HistoryUpdateValidators[column as HistoryUpdatableColumn];
  return schema.parse(value);
}

// Query param schemas
export const zOccurrencesQuery = z.object({
  start: zISODate.optional(),
  end: zISODate.optional(),
  include: z
    .string()
    .optional()
    .transform((v) => (v ? v.toLowerCase() : 'history,projection')),
  seriesId: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((n) => Number(n))
            .filter((n) => Number.isFinite(n))
        : undefined
    )
});
