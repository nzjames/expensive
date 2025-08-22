import { db } from '$lib/server/db/client';
import { tables } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ request }) => {
	const { table, id, column, value } = await request.json();

	// Validate table exists
	if (!(table in tables)) {
		return new Response(JSON.stringify({ error: 'Invalid table' }), { status: 400 });
	}

	// Update
	await db
		.update(tables[table as keyof typeof tables])
		.set({ [column]: value })
		.where(eq(tables[table as keyof typeof tables].id, id));

	return new Response(JSON.stringify({ success: true }));
};