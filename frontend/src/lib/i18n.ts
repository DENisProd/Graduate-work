import type { Locale } from '@/types';
import { dictionaries } from '@/locales';

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${K}` | `${K}.${NestedKeyOf<T[K]>}`
        : `${K}`;
    }[keyof T & string]
  : never;

export type TranslationKey = NestedKeyOf<typeof dictionaries.en>;

export function getTranslation(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const dictionary = dictionaries[locale] ?? dictionaries.en;
  const keys = key.split('.');
  
  let value: unknown = dictionary;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  if (typeof value !== 'string') {
    console.warn(`Translation value is not a string: ${key}`);
    return key;
  }
  
  if (params) {
    return Object.entries(params).reduce(
      (str, [paramKey, paramValue]) =>
        str.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue)),
      value
    );
  }
  
  return value;
}

export function createTranslator(locale: Locale) {
  return (key: TranslationKey, params?: Record<string, string | number>) =>
    getTranslation(locale, key, params);
}



