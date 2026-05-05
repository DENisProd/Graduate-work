'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher, LanguageSwitcher } from '@/components/ui';
import { useSidebar } from '@/components/ui/sidebar';
import { AccountBlock } from '@/features/auth';
import { MenuIcon, ArrowLeftIcon } from './icons';

interface DashboardHeaderProps {
  t: (key: Parameters<typeof import('@/lib/i18n').getTranslation>[1]) => string;
  selectedHouseId: string | null;
  selectedHouseName: string | null;
}

type Breadcrumb = {
  label: string;
  href?: string;
};

const HOUSE_SECTION_KEYS = ['rooms', 'members', 'roles', 'devices', 'scenarios'] as const;

function sectionLabel(
  t: DashboardHeaderProps['t'],
  seg: (typeof HOUSE_SECTION_KEYS)[number],
): string {
  const map: Record<(typeof HOUSE_SECTION_KEYS)[number], Parameters<DashboardHeaderProps['t']>[0]> = {
    rooms: 'dashboard.sections.rooms',
    members: 'dashboard.sections.members',
    roles: 'dashboard.sections.roles',
    devices: 'dashboard.sections.devices',
    scenarios: 'dashboard.sections.scenarios',
  };
  return t(map[seg]);
}

export function DashboardHeader({
  t,
  selectedHouseId,
  selectedHouseName,
}: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  const getBreadcrumbs = (): Breadcrumb[] => {
    const breadcrumbs: Breadcrumb[] = [
      { label: t('navigation.dashboard'), href: '/dashboard' },
    ];

    if (pathname === '/dashboard') return breadcrumbs;

    if (pathname.startsWith('/dashboard/houses')) {
      breadcrumbs.push({
        label: t('dashboard.myHouses'),
        href: '/dashboard/houses',
      });

      const houseId =
        pathname.match(/^\/dashboard\/houses\/([^/]+)/)?.[1] ?? selectedHouseId;

      if (houseId) {
        const houseLabel =
          selectedHouseName ?? `${t('dashboard.myHouses')} #${houseId}`;
        const hid = encodeURIComponent(houseId);
        breadcrumbs.push({
          label: houseLabel,
          href: `/dashboard/houses/${hid}`,
        });

        if (pathname.includes('/room-planner')) {
          breadcrumbs.push({ label: t('navigation.room_planner') });
          return breadcrumbs;
        }

        const parts = pathname.split('/').filter(Boolean);
        const houseIdx = parts.indexOf('houses');
        const seg = houseIdx >= 0 ? parts[houseIdx + 2] : undefined;

        if (seg === 'devices' && parts[houseIdx + 3]) {
          breadcrumbs.push({
            label: t('dashboard.sections.devices'),
            href: `/dashboard/houses/${hid}/devices`,
          });
          breadcrumbs.push({ label: t('dashboard.breadcrumb.device') });
          return breadcrumbs;
        }

        if (seg && (HOUSE_SECTION_KEYS as readonly string[]).includes(seg)) {
          breadcrumbs.push({
            label: sectionLabel(t, seg as (typeof HOUSE_SECTION_KEYS)[number]),
          });
        }
      }

      return breadcrumbs;
    }

    return breadcrumbs;
  };

  const showBackButton = pathname.includes('/room-planner');

  const handleBack = () => {
    const houseId = pathname.match(/\/houses\/([^/]+)\//)?.[1];
    if (houseId) {
      router.push(`/dashboard/houses/${encodeURIComponent(houseId)}`);
    } else {
      router.back();
    }
  };

  const breadcrumbs = getBreadcrumbs();
  const visibleBreadcrumbs =
    breadcrumbs.length > 2 ? breadcrumbs.slice(-2) : breadcrumbs;

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          onPress={toggleSidebar}
          className="md:hidden"
          aria-label={t('dashboard.sidebar.open')}
        >
          <MenuIcon className="h-6 w-6" />
        </Button>

        {showBackButton && (
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            onPress={handleBack}
            className="text-muted-foreground hover:text-foreground"
            aria-label={t('common.back')}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
        )}

        <nav aria-label="Breadcrumbs">
          <ol className="flex items-center text-sm">
            {breadcrumbs.length > 2 && (
              <li className="flex items-center">
                <span className="text-muted-foreground">...</span>
                <span className="mx-2 text-muted-foreground/60">/</span>
              </li>
            )}
            {visibleBreadcrumbs.map((crumb, index, array) => {
              const isLast = index === array.length - 1;
              const content =
                crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      isLast
                        ? 'font-semibold text-foreground'
                        : 'text-muted-foreground'
                    }
                  >
                    {crumb.label}
                  </span>
                );

              return (
                <li
                  key={`${crumb.label}-${index}`}
                  className="flex items-center"
                >
                  {index > 0 && (
                    <span className="mx-2 text-muted-foreground/60">/</span>
                  )}
                  {content}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeSwitcher />
        <AccountBlock />
      </div>
    </header>
  );
}
