import type { LocaleConfig, Locale } from '@/types';

export const locales = ['en', 'ru'] as const;

export const i18nConfig: LocaleConfig = {
  defaultLocale: 'en',
  locales: locales,
  cookieName: 'NEXT_LOCALE',
};

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
};



