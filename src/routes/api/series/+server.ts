import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { expenseSeries } from '$lib/server/db/schema';

export async function GET() {
	try {
		const data = await db.select().from(expenseSeries);
		return json(data);
	} catch (err) {
		console.error('Error fetching expenses:', err);
		return new Response('Internal Server Error', { status: 500 });
	}
}