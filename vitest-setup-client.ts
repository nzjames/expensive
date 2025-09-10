/// <reference types="@vitest/browser/matchers" />
/// <reference types="@vitest/browser/providers/playwright" />

// Bring in global styles so component tests look closer to the app
import './src/app.css';

// Minimal fetch stub for SvelteKit endpoints during component tests.
// These tests render isolated components; there is no running Kit server.
// Override or spy in individual tests if you need specific behaviors.
const realFetch = globalThis.fetch?.bind(globalThis);
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname + input.search : (input as Request).url;
  if (typeof url === 'string' && url.startsWith('/api/')) {
    // Generic empty dataset default; tailor per-test with vi.spyOn(globalThis, 'fetch', ...)
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }
  if (realFetch) return realFetch(input as any, init);
  throw new Error('fetch not available in test environment');
}) as any;
