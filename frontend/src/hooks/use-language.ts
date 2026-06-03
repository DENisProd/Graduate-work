'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useLanguageStore } from '@/store';
import { getDictionary } from '@/locales';
import { getTranslation } from '@/lib/i18n';
import type { Locale } from '@/types';

export function useLanguage() {
  const { locale, setLocale } = useLanguageStore();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const dictionary = getDictionary(mounted ? locale : 'en');

  const t = useCallback(
    (key: Parameters<typeof getTranslation>[1], params?: Record<string, string | number>) => {
      return getTranslation(mounted ? locale : 'en', key, params);
    },
    [locale, mounted]
  );

  const setEnglish = useCallback(() => setLocale('en'), [setLocale]);
  const setRussian = useCallback(() => setLocale('ru'), [setLocale]);

  return {
    locale: mounted ? locale : ('en' as Locale),
    mounted,
    dictionary,
    t,
    setLocale,
    setEnglish,
    setRussian,
  };
}

export function useTranslation() {
  const { t, locale, mounted } = useLanguage();
  
  return {
    t,
    locale,
    ready: mounted,
  };
}



