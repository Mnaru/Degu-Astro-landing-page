import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  site: 'https://degu.lt',
  i18n: {
    defaultLocale: 'lt',
    locales: ['en', 'lt'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
