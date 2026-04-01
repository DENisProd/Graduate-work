'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useThemeStore } from '@/store';
import type { ThemeMode } from '@/types';

export function useTheme() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useThemeStore();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const isDark = mounted ? resolvedTheme === 'dark' : false;
  const isLight = mounted ? resolvedTheme === 'light' : true;
  const isSystem = mounted ? theme === 'system' : false;

  const setLightTheme = useCallback(() => setTheme('light'), [setTheme]);
  const setDarkTheme = useCallback(() => setTheme('dark'), [setTheme]);
  const setSystemTheme = useCallback(() => setTheme('system'), [setTheme]);

  return {
    theme: mounted ? theme : ('system' as ThemeMode),
    resolvedTheme: mounted ? resolvedTheme : ('light' as const),
    isDark,
    isLight,
    isSystem,
    mounted,
    setTheme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
  };
}



