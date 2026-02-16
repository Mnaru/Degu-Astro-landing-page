import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://degu.studio',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'lt'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
});
