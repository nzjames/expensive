import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const expenseTemplates = sqliteTable(
  'expense_templates',
  {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
    provider: text('provider'),
    type: text('type'),
    status: text('status').notNull().default('active'),
    frequencyInterval: integer('frequency_interval').notNull(),
    frequencyUnit: text('frequency_unit').notNull(),
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
    index('ix_templates_status').on(t.status),
    index('ix_templates_nextDate').on(t.nextDate),
  ]
);

export const expenseInstances = sqliteTable(
  'expense_instances',
  {
    id: integer('id').primaryKey(),
    templateId: integer('template_id').references(() => expenseTemplates.id),
    expectedDate: text('expected_date').notNull(),
    actualDate: text('actual_date'),
    amountCents: integer('amount_cents'),
    status: text('status').default('pending'),
    note: text('note'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    uniqueIndex('ux_instances_template_expectedDate').on(t.templateId, t.expectedDate),
    index('ix_instances_status_expectedDate').on(t.status, t.expectedDate),
    index('ix_instances_template_status').on(t.templateId, t.status),
  ]
);

export const tables = { expenseTemplates, expenseInstances };
export type TableName = keyof typeof tables;
