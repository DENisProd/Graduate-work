'use client';

import Link from 'next/link';
import { AppLogo } from '@/components/layout/app-logo';
import { useTranslation } from '@/hooks';
import { cn } from '@/lib/utils';

interface FooterLink {
  name: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

export function Footer7({ className }: { className?: string }) {
  const { t, ready } = useTranslation();
  const currentYear = new Date().getFullYear();

  if (!ready) {
    return null;
  }

  const sections: FooterSection[] = [
    {
      title: t('footer.sections.product.title'),
      links: [
        { name: t('footer.sections.product.links.dashboard'), href: '/dashboard' },
        { name: t('footer.sections.product.links.admin'), href: '/admin' },
        { name: t('footer.sections.product.links.features'), href: '/#features' },
        { name: t('footer.sections.product.links.capabilities'), href: '/#value-props' },
      ],
    },
    {
      title: t('footer.sections.platform.title'),
      links: [
        { name: t('footer.sections.platform.links.home'), href: '/' },
        { name: t('footer.sections.platform.links.deviceAuth'), href: '/device-auth' },
        { name: t('footer.sections.platform.links.settings'), href: '/dashboard/settings' },
        { name: t('footer.sections.platform.links.profile'), href: '/profile' },
      ],
    },
    {
      title: t('footer.sections.resources.title'),
      links: [
        { name: t('footer.sections.resources.links.about'), href: '/#value-props' },
        { name: t('footer.sections.resources.links.invite'), href: '/invite' },
        { name: t('footer.sections.resources.links.adminDevices'), href: '/admin/devices' },
        { name: t('footer.sections.resources.links.accessControl'), href: '/admin/access-control' },
      ],
    },
  ];

  const legalLinks: FooterLink[] = [
    { name: t('footer.legal.terms'), href: '#' },
    { name: t('footer.legal.privacy'), href: '#' },
  ];

  return (
    <footer className={cn('border-t border-border bg-background', className)}>
      <div className="container mx-auto px-4 py-12 md:px-6 md:py-16">
        <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start lg:text-left">
          <div className="flex w-full max-w-sm flex-col gap-5">
            <AppLogo label={t('header.title')} labelClassName="text-xl font-semibold" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('footer.description')}
            </p>
          </div>

          <div className="grid w-full gap-8 sm:grid-cols-2 md:grid-cols-3 lg:gap-16">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-4 text-sm font-semibold text-foreground">{section.title}</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {section.links.map((link) => (
                    <li key={link.href + link.name}>
                      <Link
                        href={link.href}
                        className="font-medium transition-colors hover:text-primary"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-4 border-t border-border pt-8 text-xs font-medium text-muted-foreground md:flex-row md:items-center">
          <p>{t('footer.copyright', { year: currentYear })}</p>
          <ul className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            {legalLinks.map((link) => (
              <li key={link.name}>
                <Link href={link.href} className="transition-colors hover:text-primary">
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
