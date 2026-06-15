import type { FooterAudience } from '@/lib/auth/footer-audience';
import { isFooterLinkVisible } from '@/lib/auth/footer-audience';
import type { getTranslation } from '@/lib/i18n';

export interface FooterLinkItem {
  name: string;
  href: string;
  visibleFor: readonly FooterAudience[];
}

export interface FooterNavSection {
  title: string;
  links: FooterLinkItem[];
}

type TranslateFn = (
  key: Parameters<typeof getTranslation>[1],
  params?: Record<string, string | number>,
) => string;

import {
  AUDIENCE_ALL as ALL,
  AUDIENCE_AUTHENTICATED as AUTHENTICATED,
  AUDIENCE_GUEST_ONLY as GUEST_ONLY,
  AUDIENCE_PLATFORM_ADMIN as PLATFORM_ADMIN,
} from '@/lib/auth/footer-audience';

export function buildFooterSections(
  t: TranslateFn,
  audience: FooterAudience,
): FooterNavSection[] {
  const allSections: FooterNavSection[] = [
    {
      title: t('footer.sections.product.title'),
      links: [
        {
          name: t('footer.sections.product.links.dashboard'),
          href: '/dashboard',
          visibleFor: AUTHENTICATED,
        },
        {
          name: t('footer.sections.product.links.admin'),
          href: '/admin',
          visibleFor: PLATFORM_ADMIN,
        },
        {
          name: t('footer.sections.product.links.features'),
          href: '/#features',
          visibleFor: ALL,
        },
        {
          name: t('footer.sections.product.links.capabilities'),
          href: '/#value-props',
          visibleFor: ALL,
        },
        {
          name: t('auth.login'),
          href: '/auth/signin',
          visibleFor: GUEST_ONLY,
        },
      ],
    },
    {
      title: t('footer.sections.platform.title'),
      links: [
        {
          name: t('footer.sections.platform.links.home'),
          href: '/',
          visibleFor: ALL,
        },
        {
          name: t('footer.sections.platform.links.deviceAuth'),
          href: '/device-auth',
          visibleFor: AUTHENTICATED,
        },
        {
          name: t('footer.sections.platform.links.settings'),
          href: '/dashboard/settings',
          visibleFor: AUTHENTICATED,
        },
        {
          name: t('footer.sections.platform.links.profile'),
          href: '/profile',
          visibleFor: AUTHENTICATED,
        },
      ],
    },
    {
      title: t('footer.sections.resources.title'),
      links: [
        {
          name: t('footer.sections.resources.links.about'),
          href: '/#value-props',
          visibleFor: ALL,
        },
        {
          name: t('footer.sections.resources.links.invite'),
          href: '/invite',
          visibleFor: AUTHENTICATED,
        },
        {
          name: t('footer.sections.resources.links.adminDevices'),
          href: '/admin/devices',
          visibleFor: PLATFORM_ADMIN,
        },
        {
          name: t('footer.sections.resources.links.accessControl'),
          href: '/admin/access-control',
          visibleFor: PLATFORM_ADMIN,
        },
      ],
    },
  ];

  return allSections
    .map((section) => ({
      ...section,
      links: section.links.filter((link) => isFooterLinkVisible(link.visibleFor, audience)),
    }))
    .filter((section) => section.links.length > 0);
}

export function buildFooterLegalLinks(t: TranslateFn): FooterLinkItem[] {
  return [
    { name: t('footer.legal.terms'), href: '#', visibleFor: ALL },
    { name: t('footer.legal.privacy'), href: '#', visibleFor: ALL },
  ];
}
