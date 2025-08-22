import { relations } from "drizzle-orm/relations";
import { expenseTemplates, expenseInstances } from "./schema";

export const expenseInstancesRelations = relations(expenseInstances, ({one}) => ({
	expenseTemplate: one(expenseTemplates, {
		fields: [expenseInstances.templateId],
		references: [expenseTemplates.id]
	}),
}));

export const expenseTemplatesRelations = relations(expenseTemplates, ({many}) => ({
	expenseInstances: many(expenseInstances),
}));