import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://degu.lt',
  i18n: {
    defaultLocale: 'lt',
    locales: ['en', 'lt'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
