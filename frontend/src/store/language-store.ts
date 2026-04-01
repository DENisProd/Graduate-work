'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Locale, LanguageStore } from '@/types';
import { i18nConfig } from '@/config';
import { setCookie } from '@/lib/utils';

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      locale: i18nConfig.defaultLocale,
      
      setLocale: (locale: Locale) => {
        // Сохраняем в cookie для middleware
        setCookie(i18nConfig.cookieName, locale);
        
        // Обновляем html lang атрибут
        if (typeof document !== 'undefined') {
          document.documentElement.lang = locale;
        }
        
        set({ locale });
      },
    }),
    {
      name: 'smart-home-language',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          document.documentElement.lang = state.locale;
          setCookie(i18nConfig.cookieName, state.locale);
        }
      },
    }
  )
);



