'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Building2,
  ChevronUp,
  Cpu,
  DoorOpen,
  Gauge,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Map,
  Settings,
  Shield,
  User,
  Users,
  Workflow,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/user-store';
import DashboardNavigation, { type Route } from '@/components/sidebar-02/nav-main';
import type { HouseResponse } from '@/types/api';
import { DashboardIcon, CloseIcon } from './icons';

interface DashboardSidebarProps {
  routes: Route[];
  isActive: (href: string) => boolean;
  expandedGroups: Record<string, boolean>;
  toggleGroup: (group: string) => void;
  t: (key: Parameters<typeof import('@/lib/i18n').getTranslation>[1]) => string;
  selectedHouseId: string | null;
  selectedHouseName: string | null;
}

function DashboardCurrentHouseBlock({
  selectedHouseId,
  selectedHouseName,
  t,
}: {
  selectedHouseId: string;
  selectedHouseName: string | null;
  t: DashboardSidebarProps['t'];
}) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const name = selectedHouseName ?? `#${selectedHouseId}`;
  const fullLabel = `${t('dashboard.currentHouse')}: ${name}`;
  const housesListHref = '/dashboard';
  const backLabel = t('common.back');

  const backLinkClass = cn(
    'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
    'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  );

  if (isCollapsed) {
    return (
      <div className="border-b border-border/60 px-2 py-2">
        <div className="flex flex-col items-center gap-2">
          <Link
            href={housesListHref}
            className={backLinkClass}
            aria-label={backLabel}
            title={`${backLabel} — ${t('dashboard.myHouses')}`}
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
          <span title={fullLabel}>
            <Building2 className="size-5 text-primary" aria-hidden />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border/60 px-3 py-3">
      <div className="flex items-start gap-2">
        <Link
          href={housesListHref}
          className={cn(backLinkClass, 'mt-0.5')}
          aria-label={backLabel}
          title={`${backLabel} — ${t('dashboard.myHouses')}`}
        >
          <ArrowLeft className="size-4" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {t('dashboard.currentHouse')}
          </p>
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        </div>
      </div>
    </div>
  );
}

function SidebarUserCard({ t }: { t: DashboardSidebarProps['t'] }) {
  const { data: session } = useSession();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const router = useRouter();
  const logoutStore = useUserStore((s) => s.logout);

  const user = session?.user;
  const displayName = user?.name ?? user?.email ?? t('auth.account');
  const email = user?.email ?? '';
  const initials =
    displayName
      .split(/\s+/)
      .map((s) => s[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    logoutStore();
    router.push('/');
  };

  const avatarEl = user?.image ? (
    <img
      src={user.image}
      alt=""
      className="h-8 w-8 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
      {initials}
    </div>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors',
            'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isCollapsed && 'justify-center px-0',
          )}
        >
          {avatarEl}
          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-none text-foreground">
                  {displayName}
                </p>
                {email && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {email}
                  </p>
                )}
              </div>
              <ChevronUp className="size-3.5 shrink-0 text-muted-foreground" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={isCollapsed ? 'right' : 'top'}
        align={isCollapsed ? 'start' : 'end'}
        className="mb-1 w-56"
      >
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium leading-none">{displayName}</p>
          {email && (
            <p className="mt-1 truncate text-xs text-muted-foreground">{email}</p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 size-4" />
            {t('auth.profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={(e) => {
            e.preventDefault();
            void handleSignOut();
          }}
        >
          <LogOut className="mr-2 size-4" />
          {t('auth.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function sameHousePath(pathname: string, houseId: string): boolean {
  const m = pathname.match(/^\/dashboard\/houses\/([^/]+)/);
  if (!m) return false;
  try {
    return decodeURIComponent(m[1]) === decodeURIComponent(houseId);
  } catch {
    return m[1] === houseId;
  }
}

export function DashboardSidebar({
  routes,
  isActive,
  expandedGroups,
  toggleGroup,
  t,
  selectedHouseId,
  selectedHouseName,
}: DashboardSidebarProps) {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader
        className={cn(
          'px-3 py-3',
          isCollapsed
            ? 'flex flex-col items-center gap-3'
            : 'flex flex-row items-center justify-between',
        )}
      >
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-2.5"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <DashboardIcon className="h-4 w-4 text-primary" />
          </div>
          {!isCollapsed && (
            <span className="truncate text-sm font-semibold text-foreground">
              {t('header.title')}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-1">
          <SidebarTrigger className="h-7 w-7" />
          {isMobile && (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={() => setOpenMobile(false)}
              className="h-7 w-7 md:hidden"
            >
              <CloseIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      {selectedHouseId ? (
        <DashboardCurrentHouseBlock
          selectedHouseId={selectedHouseId}
          selectedHouseName={selectedHouseName}
          t={t}
        />
      ) : null}

      <SidebarContent className="px-1 py-2">
        <DashboardNavigation
          routes={routes}
          isActive={isActive}
          openGroups={expandedGroups}
          onToggleGroup={toggleGroup}
        />
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="px-2 py-3">
        <SidebarUserCard t={t} />
      </SidebarFooter>
    </Sidebar>
  );
}

interface HouseNavPermissions {
  canEditRoles: boolean;
  isOwner: boolean;
}

export function buildDashboardRoutes(
  t: (key: Parameters<typeof import('@/lib/i18n').getTranslation>[1]) => string,
  selectedHouseId: string | null,
  _selectedHouseName: string | null,
  userHouses: HouseResponse[],
  pathname: string,
  permissions?: HouseNavPermissions,
): Route[] {
  const overviewSection = t('navigation.overview');
  const propertiesSection = t('navigation.properties');

  const routes: Route[] = [];

  if (!selectedHouseId) {
    routes.push(
      {
        id: 'dashboard-home',
        title: t('navigation.dashboard'),
        link: '/dashboard',
        icon: <LayoutDashboard className="size-4" />,
        section: overviewSection,
        isActive: pathname === '/dashboard',
      },
      {
        id: 'dashboard-settings',
        title: t('common.settings'),
        link: '/dashboard/settings',
        icon: <Settings className="size-4" />,
        section: overviewSection,
        isActive: pathname.startsWith('/dashboard/settings'),
      },
      {
        id: 'houses',
        title: t('dashboard.myHouses'),
        link: '/dashboard',
        icon: <Building2 className="size-4" />,
        section: propertiesSection,
        subs: userHouses.slice(0, 10).map((house) => {
          const houseRouteId = house.uuid ?? String(house.id);
          const houseLink = `/dashboard/houses/${encodeURIComponent(houseRouteId)}`;
          return {
            title: house.name,
            link: houseLink,
            icon: <Building2 className="size-4" />,
            isActive: pathname.startsWith(houseLink),
          };
        }),
        isActive: pathname.startsWith('/dashboard/houses/'),
      },
    );
  }

  if (selectedHouseId) {
    const hid = encodeURIComponent(selectedHouseId);
    const base = `/dashboard/houses/${hid}`;
    const sh = () => sameHousePath(pathname, selectedHouseId);

    routes.push(
      {
        id: 'house-overview',
        title: t('dashboard.sections.overview'),
        link: base,
        icon: <LayoutGrid className="size-4" />,
        section: propertiesSection,
        isActive: sh() && /^\/dashboard\/houses\/[^/]+$/.test(pathname),
      },
      {
        id: 'house-rooms',
        title: t('admin.accessControl.houseRooms'),
        link: `${base}/rooms`,
        icon: <DoorOpen className="size-4" />,
        section: propertiesSection,
        isActive: sh() && /\/rooms(?:\/|$)/.test(pathname),
      },
      {
        id: 'house-room-planner',
        title: t('navigation.room_planner'),
        link: `${base}/room-planner`,
        icon: <Map className="size-4" />,
        section: propertiesSection,
        isActive: pathname.startsWith(`${base}/room-planner`),
      },
      {
        id: 'house-members',
        title: t('admin.accessControl.members'),
        link: `${base}/members`,
        icon: <Users className="size-4" />,
        section: propertiesSection,
        isActive: sh() && /\/members(?:\/|$)/.test(pathname),
      },
    );

    if (!permissions || permissions.canEditRoles) {
      routes.push({
        id: 'house-roles',
        title: t('admin.accessControl.roles'),
        link: `${base}/roles`,
        icon: <Shield className="size-4" />,
        section: propertiesSection,
        isActive: sh() && /\/roles(?:\/|$)/.test(pathname),
      });
    }

    routes.push(
      {
        id: 'house-devices',
        title: t('admin.tabs.devices'),
        link: `${base}/devices`,
        icon: <Cpu className="size-4" />,
        section: propertiesSection,
        isActive: sh() && pathname.includes(`${base}/devices`),
      },
      {
        id: 'house-scenarios',
        title: t('admin.accessControl.scenarios'),
        link: `${base}/scenarios`,
        icon: <Workflow className="size-4" />,
        section: propertiesSection,
        isActive: sh() && /\/scenarios(?:\/|$)/.test(pathname),
      },
    );

    if (!permissions || permissions.isOwner) {
      routes.push({
        id: 'house-settings',
        title: t('common.settings'),
        link: `${base}/settings`,
        icon: <Settings className="size-4" />,
        section: propertiesSection,
        isActive: sh() && /\/settings(?:\/|$)/.test(pathname),
      });
    }
  }

  return routes;
}
