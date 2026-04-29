import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'lt',
        locales: { en: 'en', lt: 'lt' },
      },
      // Vercel rewrites `/` → `/lt/` for the homepage only. Map the LT homepage
      // URL (and any hreflang alternate pointing to it) to `/` so the sitemap
      // matches the actually-served URL and avoids `/` vs `/lt/` duplication.
      serialize(item) {
        const fixHomepage = (url) =>
          url.replace(/^https:\/\/degu\.lt\/lt\/?$/, 'https://degu.lt/');
        item.url = fixHomepage(item.url);
        if (item.links) {
          item.links = item.links.map((link) => ({
            ...link,
            url: fixHomepage(link.url),
          }));
        }
        return item;
      },
    }),
  ],
  site: 'https://degu.lt',
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  i18n: {
    defaultLocale: 'lt',
    locales: ['en', 'lt'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
