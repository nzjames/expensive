// Supplies global nav. Runs on server + client.
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = () => {
  return {
    nav: [
      { href: '/', label: 'Home' },
      { href: '/series', label: 'Series' },
      { href: '/history', label: 'History' }
    ]
  };
};
