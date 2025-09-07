import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

import { SeriesStatus } from '../../data';

export const expenseSeries = sqliteTable(
  'expense_series',
  {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
    provider: text('provider'),
    type: text('type'),
    status: text('status').notNull().default(SeriesStatus.Active),
    frequencyInterval: integer('frequency_interval').notNull(),
    frequencyUnit: text('frequency_unit').notNull(),
    rrule: text('rrule'),
    paymentMethod: text('payment_method'),
    amountCents: integer('amount_cents').notNull(),
    contactEmail: text('contact_email'),
    portalUrl: text('portal_url'),
    nextDate: text('next_date'),
    renewalDate: text('renewal_date'),
    verifiedDate: text('verified_date'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at'),
  },
  (t) => [
    index('ix_series_status').on(t.status),
    index('ix_series_nextDate').on(t.nextDate),
  ]
);

export const expenseHistory = sqliteTable(
  'expense_history',
  {
    id: integer('id').primaryKey(),

    // Link back to the parent series for grouping/reporting
    seriesId: integer('series_id').references(() => expenseSeries.id),

    // Snapshot fields copied from expense_series at creation time
    name: text('name').notNull(),
    provider: text('provider'),
    type: text('type'),
    paymentMethod: text('payment_method'),
    amountCents: integer('amount_cents').notNull(),

    // snapshot cadence for categorising and auditing
    frequencyInterval: integer('frequency_interval').notNull(),
    frequencyUnit: text('frequency_unit').notNull(), // "days" | "weeks" | "months" | "years"


    // The “fixed in history” date
    expenseDate: text('expense_date').notNull(),

    // Resolution fields
    actualDate: text('actual_date'),
    status: text('status').default('pending'),
    note: text('note'),

    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    uniqueIndex('ux_history_series_expenseDate').on(t.seriesId, t.expenseDate),
    index('ix_history_status_expenseDate').on(t.status, t.expenseDate),
    index('ix_history_series_status').on(t.seriesId, t.status),
  ]
);


export const tables = { expenseSeries, expenseHistory };
export type TableName = keyof typeof tables;
