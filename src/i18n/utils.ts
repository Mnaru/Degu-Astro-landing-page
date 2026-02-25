import { translations, type Locale, type Translations } from './translations';

const locales = Object.keys(translations) as Locale[];
const defaultLocale: Locale = 'lt';

/** Extract locale from a page URL (e.g. /en/foo -> "en", / -> "lt") */
export function getLocaleFromUrl(url: URL): Locale {
  const segment = url.pathname.split('/')[1] as Locale;
  return locales.includes(segment) && segment !== defaultLocale ? segment : defaultLocale;
}

/** Get the translations object for a given locale */
export function t(locale: string): Translations {
  return translations[locale as Locale] ?? translations[defaultLocale];
}

/** Build a localized path. Both locales use /lt/ and /en/ prefixes. */
export function getLocalizedPath(path: string, locale: string): string {
  const clean = path.replace(/^\/(en|lt)/, '');
  return `/${locale}${clean || '/'}`;
}
