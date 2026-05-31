'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslation } from '@/hooks';
import { useFooterAudience } from '@/hooks/use-footer-audience';
import { buildFooterLegalLinks, buildFooterSections } from '@/lib/auth/footer-nav';

export function LandingFooter() {
  const { t, ready } = useTranslation();
  const { audience, isLoading } = useFooterAudience();
  const currentYear = new Date().getFullYear();

  const sections = useMemo(
    () => (ready ? buildFooterSections(t, audience) : []),
    [ready, t, audience],
  );

  const legalLinks = useMemo(() => (ready ? buildFooterLegalLinks(t) : []), [ready, t]);

  if (!ready || isLoading) {
    return null;
  }

  return (
    <footer className="landing-footer">
      <div className="container py-10 md:py-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm space-y-4">
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-primary-foreground transition-opacity group-hover:opacity-85">
                Д
              </span>
              <span className="text-sm font-semibold">{t('header.title')}</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('footer.description')}
            </p>
          </div>

          {sections.length > 0 && (
            <div className="grid w-full gap-8 sm:grid-cols-2 md:grid-cols-3 lg:max-w-2xl lg:gap-12">
              {sections.map((section) => (
                <div key={section.title}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/80">
                    {section.title}
                  </h3>
                  <ul className="space-y-2.5">
                    {section.links.map((link) => (
                      <li key={`${section.title}-${link.href}-${link.name}`}>
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col justify-between gap-4 border-t border-border/50 pt-6 text-[11px] text-muted-foreground/70 sm:flex-row sm:items-center">
          <p>{t('footer.copyright', { year: currentYear })}</p>
          <ul className="flex flex-wrap items-center gap-4">
            {legalLinks.map((link) => (
              <li key={link.name}>
                <Link href={link.href} className="transition-colors hover:text-foreground">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
