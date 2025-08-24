<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import { page } from '$app/stores';

  // props from SvelteKit: route data + the child renderer
  let { children, data } = $props() as {
    children: () => any;
    data: { nav: { href: string; label: string }[] };
  };

  const isActive = (href: string, path: string) =>
    path === href || (href !== '/' && path.startsWith(href));
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>{$page.data.title ?? 'App'}</title>
</svelte:head>

<header class="border-b">
  <div class="mx-auto  px-4 py-3 flex items-center justify-between">
    <h1 class="text-xl font-semibold truncate">
      {$page.data.title ?? 'App'}
    </h1>

    <nav class="flex gap-3">
      {#each data.nav as item (item.href)}
        <a
          href={item.href}
          data-sveltekit-preload-data 
          aria-current={isActive(item.href, $page.url.pathname) ? 'page' : undefined}
          class="px-2 py-1 rounded-md text-sm transition
                 hover:bg-gray-100
                 {isActive(item.href, $page.url.pathname) ? 'font-medium underline' : 'text-gray-600'}">
          {item.label}
        </a>
      {/each}
    </nav>
  </div>
</header>

<main class="mx-auto  py-8">
  {@render children?.()}
</main>