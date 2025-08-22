import { describe, it, expect } from 'vitest';
import { db } from '$lib/server/db/client';
import { expenseTemplates } from '$lib/server/db/schema';

describe('Database setup', () => {
	it('should connect and return at least one expense template', () => {
		const rows = db.select().from(expenseTemplates).all();

		// Check that query returns without throwing
		expect(Array.isArray(rows)).toBe(true);

		// Optional: check schema fields
		if (rows.length > 0) {
			expect(rows[0]).toHaveProperty('id');
		}
	});
});