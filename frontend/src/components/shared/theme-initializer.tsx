'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store';

export function ThemeInitializer() {
  const { theme } = useThemeStore();

  useEffect(() => {
    const getSystemTheme = () =>
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
    const root = document.documentElement;
    const html = document.querySelector('html');

    root.classList.remove('light', 'dark');
    if (html) {
      html.classList.remove('light', 'dark');
    }

    root.classList.add(resolvedTheme);
    if (html) {
      html.classList.add(resolvedTheme);
    }

    root.setAttribute('data-theme', resolvedTheme);
    if (html) {
      html.setAttribute('data-theme', resolvedTheme);
    }

    root.style.colorScheme = resolvedTheme;
  }, [theme]);

  return null;
}

