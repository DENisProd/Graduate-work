'use client';

import Link from 'next/link';
import { ThemeToggle, LanguageSwitcher } from '@/components/ui';
import { AccountBlock } from '@/features/auth';
import { useFooterAudience, useTranslation } from '@/hooks';
import { AppLogo } from './app-logo';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
} from '@/components/ui/sheet';
import { isFooterLinkVisible } from '@/lib/auth/footer-audience';
import { getTranslation } from '@/lib/i18n';

type TranslationFn = (
  key: Parameters<typeof getTranslation>[1],
  params?: Record<string, string | number>,
) => string;

/* ── Hamburger icon ──────────────────────────────────────────────── */
const MenuIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

/* ── Shared nav links ────────────────────────────────────────────── */
const NAV_LINK_BASE =
  'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground';

interface NavLinksProps {
  closeOnClick?: boolean;
  audience: 'guest' | 'user' | 'platformAdmin';
  t: TranslationFn;
}

function NavLinks({ closeOnClick, audience, t }: NavLinksProps) {
  const links = [
    {
      href: '/dashboard',
      label: t('navigation.dashboard'),
      visibleFor: ['user', 'platformAdmin'],
    },
    {
      href: '/dashboard/settings',
      label: t('navigation.settings'),
      visibleFor: ['user', 'platformAdmin'],
    },
    {
      href: '/admin',
      label: t('navigation.admin'),
      visibleFor: ['platformAdmin'],
    },
  ].filter(({ visibleFor }) => isFooterLinkVisible(visibleFor, audience));

  if (links.length === 0) {
    return null;
  }

  if (closeOnClick) {
    return (
      <>
        {links.map(({ href, label }) => (
          <SheetClose key={href} asChild>
            <Link
              href={href}
              className="flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {label}
            </Link>
          </SheetClose>
        ))}
      </>
    );
  }

  return (
    <>
      {links.map(({ href, label }) => (
        <Link key={href} href={href} className={NAV_LINK_BASE}>
          {label}
        </Link>
      ))}
    </>
  );
}

/* ── Header ──────────────────────────────────────────────────────── */
export function Header() {
  const { t } = useTranslation();
  const { audience, isLoading } = useFooterAudience();
  const showNavLinks = !isLoading && audience !== 'guest';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">

          <div className="flex items-center gap-8">
            <AppLogo label={t('home.title')} labelClassName="hidden sm:inline" />

            {showNavLinks ? (
              <nav className="hidden items-center gap-6 md:flex">
                <NavLinks audience={audience} t={t} />
              </nav>
            ) : null}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <LanguageSwitcher />
            <ThemeToggle />
            <AccountBlock />
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <AccountBlock />

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  aria-label="Open menu"
                >
                  <MenuIcon />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="flex flex-col p-0">

                <div className="flex items-center gap-2 border-b px-5 py-4">
                  <AppLogo label={t('home.title')} />
                </div>

                {showNavLinks ? (
                  <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
                    <NavLinks closeOnClick audience={audience} t={t} />
                  </nav>
                ) : null}

                <div className="flex items-center justify-between border-t px-5 py-4">
                  <span className="text-xs text-muted-foreground">
                    {t('settings.appearance')}
                  </span>
                  <div className="flex items-center gap-1">
                    <LanguageSwitcher />
                    <ThemeToggle />
                  </div>
                </div>

              </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>
    </header>
  );
}
