'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemeMode, ThemeStore } from '@/types';
import { themeConfig } from '@/config';

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const getResolvedTheme = (theme: ThemeMode): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

const applyTheme = (theme: ThemeMode): void => {
  if (typeof document === 'undefined') return;
  
  const resolvedTheme = getResolvedTheme(theme);
  const root = document.documentElement;
  const html = document.querySelector('html');
  
  // Удаляем все классы тем
  root.classList.remove('light', 'dark');
  if (html) {
    html.classList.remove('light', 'dark');
  }
  
  // Добавляем нужный класс
  root.classList.add(resolvedTheme);
  if (html) {
    html.classList.add(resolvedTheme);
  }
  
  // Устанавливаем data-theme атрибут (для HeroUI)
  root.setAttribute('data-theme', resolvedTheme);
  if (html) {
    html.setAttribute('data-theme', resolvedTheme);
  }
  
  // Также обновляем color-scheme для правильной работы браузера
  root.style.colorScheme = resolvedTheme;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: themeConfig.defaultTheme,
      resolvedTheme: 'light',
      
      setTheme: (theme: ThemeMode) => {
        applyTheme(theme);
        set({ 
          theme,
          resolvedTheme: getResolvedTheme(theme)
        });
      },
      
      toggleTheme: () => {
        const { theme } = get();
        const currentResolved = getResolvedTheme(theme);
        const newTheme: ThemeMode = currentResolved === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
        set({ 
          theme: newTheme,
          resolvedTheme: newTheme
        });
      },
    }),
    {
      name: themeConfig.storageKey,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
          state.resolvedTheme = getResolvedTheme(state.theme);
        }
      },
    }
  )
);

// Слушатель изменений системной темы
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  mediaQuery.addEventListener('change', () => {
    const { theme, setTheme } = useThemeStore.getState();
    if (theme === 'system') {
      setTheme('system');
    }
  });
}

