'use client';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks';
import { useTranslation } from '@/hooks';
import type { ThemeMode } from '@/types';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/animate-ui/components/radix/dropdown-menu';

// SVG иконки
const SunIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    height="20"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="20"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" x2="12" y1="1" y2="3" />
    <line x1="12" x2="12" y1="21" y2="23" />
    <line x1="4.22" x2="5.64" y1="4.22" y2="5.64" />
    <line x1="18.36" x2="19.78" y1="18.36" y2="19.78" />
    <line x1="1" x2="3" y1="12" y2="12" />
    <line x1="21" x2="23" y1="12" y2="12" />
    <line x1="4.22" x2="5.64" y1="19.78" y2="18.36" />
    <line x1="18.36" x2="19.78" y1="5.64" y2="4.22" />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    height="20"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="20"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SystemIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    height="20"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="20"
  >
    <rect height="14" rx="2" ry="2" width="20" x="2" y="3" />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </svg>
);

const themeIcons: Record<ThemeMode, typeof SunIcon> = {
  light: SunIcon,
  dark: MoonIcon,
  system: SystemIcon,
};

export function ThemeSwitcher() {
  const { theme, setTheme, mounted } = useTheme();
  const { t } = useTranslation();

  if (!mounted) {
    return (
      <Button
        aria-label="Toggle theme"
        variant="ghost"
        size="icon"
        className="h-10 w-10"
      >
        <div className="h-5 w-5" />
      </Button>
    );
  }

  const CurrentIcon = themeIcons[theme];

  const handleThemeChange = (key: string | number) => {
    setTheme(key as ThemeMode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t('theme.toggle')}
          variant="ghost"
          size="icon"
          className="h-10 w-10"
        >
          <CurrentIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
          <DropdownMenuRadioItem value="light">
            <SunIcon className="mr-2 h-4 w-4" />
            <span className="text-sm">{t('theme.light')}</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <MoonIcon className="mr-2 h-4 w-4" />
            <span className="text-sm">{t('theme.dark')}</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <SystemIcon className="mr-2 h-4 w-4" />
            <span className="text-sm">{t('theme.system')}</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Простой переключатель темы (только светлая/тёмная)
 */
export function ThemeToggle() {
  const { isDark, toggleTheme, mounted } = useTheme();
  const { t } = useTranslation();

  if (!mounted) {
    return (
      <Button
        aria-label="Toggle theme"
        variant="ghost"
        size="icon"
        className="h-10 w-10"
      >
        <div className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      aria-label={t('theme.toggle')}
      variant="ghost"
      size="icon"
      className="h-10 w-10"
      onClick={toggleTheme}
    >
      {isDark ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </Button>
  );
}
