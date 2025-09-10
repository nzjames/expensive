import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render at least one h1', async () => {
		render(Page);
		await expect.element(page.getByRole('heading', { name: 'Upcoming (30 days)' })).toBeVisible();
	});
});
