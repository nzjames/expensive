response from here: https://chatgpt.com/s/t_68aa699ec264819181fdcc889683aeb3

Relationship in one line: `+page.ts` (data + route options) feeds `data` into `+page.svelte` (UI). `+layout.ts` feeds shared `data` into `+layout.svelte` (wrapper UI). Child pages see parent layout data; layouts see leaf page data via the `page` store.

## What each file is for

* `+page.svelte`: UI for a single route. Receives `data` prop from its `+page.ts`. Runs in browser after hydration and on client navigations.
* `+page.ts`: “universal” `load()` for that page. Runs on the server for the first request, then in the browser on client-side navigations. Returns serializable data only. Good for fetching, params/url parsing, simple shaping. Also exports route options like `export const ssr = true`, `csr = true`, `prerender = false`.
* `+layout.svelte`: Wrapper UI. Renders once around children. Use it for app chrome, header/nav. Receives its own `data` from `+layout.ts`. To read **leaf** page data here, use the `page` store.
* `+layout.ts`: Like `+page.ts` but for data shared by all children. Nav lists, feature flags, user session summary, etc.

Server-only variants:

* `+page.server.ts` / `+layout.server.ts`: `load()` runs **only** on the server. Use when touching secrets, DB, private APIs, secure cookies, or setting headers.
* `+server.ts`: Endpoint for REST/RPC (GET/POST/PUT…). Runs only on server.

Other common route files:

* `+error.svelte`: Error UI for this route tree.
* `+loading.svelte`: Loading UI shown while a navigation’s `load()` is pending.
* `(group)/`: Route groups for organizing without affecting URLs.
* `[param]`, `[...rest]`: Dynamic and rest params.

## Data flow and where code runs

Initial SSR of `/series`:

1. Root `+layout.server.ts` → `+layout.ts` run on server, then any nested layouts likewise.
2. `+page.server.ts` → `+page.ts` for the leaf run on server.
3. HTML ships with serialized `data`. Browser hydrates `+layout.svelte` and `+page.svelte`.

Client navigation to another route:

* Only affected layouts/pages re-run their **universal** `load()` in the browser.
* Server-only loads do **not** run; they must have provided all needed data already (or you navigate through endpoints that fetch server data).
* Preloading: add `data-sveltekit-preload-data` on links to warm loads.

Sharing data:

* `+page.ts` returns `{ title: 'Series' }` → available as `data` in `+page.svelte`.
* `+layout.ts` returns `{ nav: [...] }` → available as `data` in `+layout.svelte` **and** to child `load()` via `const parentData = await parent()`.
* `+layout.svelte` reading leaf data: use the `page` store.

## Your title case

If you want the **layout header** to show the page title supplied by each page:

* Keep titles in each page’s `+page.ts`.
* In `+layout.svelte` read `page.data.title`.

Use the non-deprecated import for Svelte 5:

```svelte
<script lang="ts" use:useRunes>
  import { page } from '$app/state'; // not $app/stores
  let { children, data } = $props();
</script>

<h1>{$page.data.title ?? 'App'}</h1>
{@render children?.()}
```

And use modern preloading:

```svelte
<a href="/series" data-sveltekit-preload-data>Series</a>
```

## When to choose which load

* Use **`+page.server.ts`** if the data requires secrets, DB, or private cookies. Serialize only the safe result.
* Use **`+page.ts`** if data can be fetched publicly or shaped on client navigations too.
* Keep **fetches in `load()`**, not in components, for SSR and consistent navigation. Use the provided `fetch` inside `load` to call your own `+server.ts` endpoints or external APIs.
* Put **shared data** in `+layout.ts`. Pages can read it with `parent()`.

## Validations, caching, and updates

* Mark dependencies in `load()` with `depends('key')`. Then call `invalidate('key')` on the client to re-run that `load()`.
* Or `invalidateAll()` after a broad change (e.g., successful form action).
* Use `setHeaders()` inside server `load()` or endpoints for caching.

## Overhead concern

If a page’s title is static and you don’t need SSR for it:

* Set `<svelte:head><title>Static</title></svelte:head>` in `+page.svelte` and skip `+page.ts`.
* Or compute the title in the layout from `url.pathname`.
* Keep `+page.ts` only when you need data shaping, params, or SEO-sensitive head values at SSR.

## Minimal reference snippets

`+page.ts`:

```ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params, url, parent, depends }) => {
  depends('series:list');
  const res = await fetch('/api/series');
  const series = await res.json();
  return { title: 'Series', series };
};
```

`+page.svelte`:

```svelte
<script lang="ts" use:useRunes>
  let { data } = $props(); // { title, series }
</script>

<svelte:head><title>{data.title}</title></svelte:head>
<ul>{#each data.series as s}<li>{s.name}</li>{/each}</ul>
```

`+layout.svelte`:

```svelte
<script lang="ts" use:useRunes>
  import { page } from '$app/state';
  let { children, data } = $props(); // data.nav from +layout.ts
</script>

<header>
  <h1>{$page.data.title ?? 'App'}</h1>
  <nav>{#each data.nav as i}<a href={i.href} data-sveltekit-preload-data>{i.label}</a>{/each}</nav>
</header>

{@render children?.()}
```

`+layout.ts`:

```ts
export const load = () => ({ nav: [{ href: '/', label: 'Home' }, { href: '/series', label: 'Series' }] });
```

This covers who runs where, how data flows, and which file to use for each concern with Svelte 5 + runes.
