import { sqliteTable, AnySQLiteColumn, index, uniqueIndex, foreignKey, integer, text } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const expenseInstances = sqliteTable("expense_instances", {
	id: integer().primaryKey().notNull(),
	templateId: integer("template_id").references(() => expenseTemplates.id),
	expectedDate: text("expected_date").notNull(),
	actualDate: text("actual_date"),
	amountCents: integer("amount_cents"),
	status: text().default("pending"),
	note: text(),
	createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`"),
},
(table) => [
	index("ix_instances_template_status").on(table.templateId, table.status),
	index("ix_instances_status_expectedDate").on(table.status, table.expectedDate),
	uniqueIndex("ux_instances_template_expectedDate").on(table.templateId, table.expectedDate),
]);

export const expenseTemplates = sqliteTable("expense_templates", {
	id: integer().primaryKey().notNull(),
	name: text().notNull(),
	provider: text(),
	type: text(),
	status: text().default("active").notNull(),
	frequencyInterval: integer("frequency_interval").notNull(),
	frequencyUnit: text("frequency_unit").notNull(),
	paymentMethod: text("payment_method"),
	amountCents: integer("amount_cents").notNull(),
	contactEmail: text("contact_email"),
	portalUrl: text("portal_url"),
	nextDate: text("next_date"),
	renewalDate: text("renewal_date"),
	verifiedDate: text("verified_date"),
	createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text("updated_at"),
},
(table) => [
	index("ix_templates_nextDate").on(table.nextDate),
	index("ix_templates_status").on(table.status),
]);

