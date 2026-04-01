export type Locale = 'en' | 'ru';

export interface LanguageStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export interface Translations {
  [key: string]: string | Translations;
}

export interface TranslationNamespaces {
  common: Translations;
  navigation: Translations;
  errors: Translations;
  settings: Translations;
}

export interface LocaleConfig {
  defaultLocale: Locale;
  locales: readonly Locale[];
  cookieName: string;
}



