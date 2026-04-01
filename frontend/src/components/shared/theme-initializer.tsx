'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store';

/**
 * Компонент для инициализации темы на клиенте
 * Предотвращает мигание при загрузке
 */
export function ThemeInitializer() {
  const { theme } = useThemeStore();

  useEffect(() => {
    const getSystemTheme = () =>
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
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

    // Обновляем color-scheme
    root.style.colorScheme = resolvedTheme;
  }, [theme]);

  return null;
}

