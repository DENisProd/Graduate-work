'use client';

import Link from 'next/link';
import { ThemeSwitcher, LanguageSwitcher } from '@/components/ui';
import { AccountBlock } from '@/features/auth';
import { useTranslation } from '@/hooks';
import { AppLogo } from './app-logo';

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <AppLogo label={t('home.title')} labelClassName="hidden sm:inline" />
            
            <nav className="hidden items-center gap-6 md:flex">
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t('navigation.dashboard')}
              </Link>
              <Link 
                href="/settings" 
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t('navigation.settings')}
              </Link>
              <Link 
                href="/admin" 
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t('navigation.admin')}
              </Link>
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
            <AccountBlock />
          </div>
        </div>
      </div>
    </header>
  );
}
