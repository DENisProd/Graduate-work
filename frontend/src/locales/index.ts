import type { Locale } from '@/types';
import enCommon from './en/common.json';
import ruCommon from './ru/common.json';

export const dictionaries: Record<Locale, typeof enCommon> = {
  en: enCommon,
  ru: ruCommon,
};

export const getDictionary = (locale: Locale) => {
  return dictionaries[locale] ?? dictionaries.en;
};



