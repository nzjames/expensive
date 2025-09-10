import { describe, it, expect } from 'vitest';
import { db } from '$lib/server/db/client';
import { expenseSeries } from '$lib/server/db/schema';

describe('Database setup', () => {
	it('connects and queries without errors', () => {
		const rows = db.select().from(expenseSeries).all();
		// Fresh test DB may be empty; only assert shape and access
		expect(Array.isArray(rows)).toBe(true);
		if (rows.length > 0) expect(rows[0]).toHaveProperty('id');
	});
});
