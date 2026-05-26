'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
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
import { ChevronUp, LogOut, User } from 'lucide-react';
import DashboardNavigation, { type Route } from '@/components/sidebar-02/nav-main';
import { AppLogo } from '@/components/layout/app-logo';
import {
  FunctionIcon,
  AccessIcon,
  RoomsIcon,
  CloseIcon,
} from './icons';
import type { NavItem } from '../model/types';
import type { GroupKey } from '../model/types';

interface AdminSidebarProps {
  navItems: NavItem[];
  isActive: (href: string) => boolean;
  expandedGroups: Record<GroupKey, boolean>;
  toggleGroup: (group: GroupKey) => void;
  selectedDeviceId: string | null;
  selectedHouseId: string | null;
  selectedHouseName: string | null;
  pathname: string;
  t: (key: Parameters<typeof import('@/lib/i18n').getTranslation>[1]) => string;
}

function AdminSidebarUserCard({ t }: { t: AdminSidebarProps['t'] }) {
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
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
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

export function AdminSidebar({
  navItems,
  isActive,
  expandedGroups,
  toggleGroup,
  selectedDeviceId,
  selectedHouseId,
  selectedHouseName: _selectedHouseName,
  pathname,
  t,
}: AdminSidebarProps) {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const getGroupIcon = (group: GroupKey) => {
    const Icon = navItems.find((item) => item.group === group)?.icon;
    return Icon ? <Icon className="size-4" /> : null;
  };

  const deviceSubs: NonNullable<Route['subs']> = navItems
    .filter((item) => item.group === 'devices')
    .map((item) => {
      const Icon = item.icon;
      return {
        title: item.label,
        link: item.href,
        icon: <Icon className="size-4" />,
      };
    });

  if (selectedDeviceId) {
    deviceSubs.push({
      title: t('admin.tabs.deviceFunctions'),
      link: `/admin/devices/${selectedDeviceId}/functions`,
      icon: <FunctionIcon className="size-4" />,
      isActive: pathname.startsWith(
        `/admin/devices/${selectedDeviceId}/functions`,
      ),
    });
  }

  const referenceSubs: NonNullable<Route['subs']> = navItems
    .filter((item) => item.group === 'reference')
    .map((item) => {
      const Icon = item.icon;
      return {
        title: item.label,
        link: item.href,
        icon: <Icon className="size-4" />,
      };
    });

  const securitySubs: NonNullable<Route['subs']> = navItems
    .filter((item) => item.group === 'security')
    .map((item) => {
      const Icon = item.icon;
      return {
        title: item.label,
        link: item.href,
        icon: <Icon className="size-4" />,
      };
    });

  if (selectedHouseId) {
    securitySubs.push(
      {
        title: t('admin.accessControl.manageHouse'),
        link: `/admin/access-control/houses/${selectedHouseId}`,
        icon: <AccessIcon className="size-4" />,
        isActive:
          pathname === `/admin/access-control/houses/${selectedHouseId}` &&
          !pathname.includes('/room-planner'),
      },
      {
        title: t('admin.roomPlanner.title'),
        link: `/admin/access-control/houses/${selectedHouseId}/room-planner`,
        icon: <RoomsIcon className="size-4" />,
        isActive: pathname.startsWith(
          `/admin/access-control/houses/${selectedHouseId}/room-planner`,
        ),
      },
    );
  }

  const routes: Route[] = [
    {
      id: 'devices',
      title: t('admin.groups.devices'),
      link: '/admin/devices',
      icon: getGroupIcon('devices'),
      subs: deviceSubs,
    },
    {
      id: 'reference',
      title: t('admin.groups.reference'),
      link: '/admin/device-types',
      icon: getGroupIcon('reference'),
      subs: referenceSubs,
    },
    {
      id: 'security',
      title: t('admin.groups.security'),
      link: '/admin/access-control/houses',
      icon: getGroupIcon('security'),
      subs: securitySubs,
    },
  ];

  const handleToggleGroup = (groupId: string) => {
    if (
      groupId === 'devices' ||
      groupId === 'reference' ||
      groupId === 'security'
    ) {
      toggleGroup(groupId);
    }
  };

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
        <AppLogo
          label={t('header.title')}
          href="/admin"
          className={cn(
            'text-sm font-medium text-foreground/70 hover:text-foreground',
            isCollapsed && 'justify-center',
          )}
          labelClassName="whitespace-nowrap text-sm font-semibold"
          showLabel={!isCollapsed}
        />

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

      <SidebarContent className="gap-2 px-2 py-4">
        <DashboardNavigation
          routes={routes}
          isActive={isActive}
          openGroups={expandedGroups}
          onToggleGroup={handleToggleGroup}
        />
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="px-2 py-3">
        <AdminSidebarUserCard t={t} />
      </SidebarFooter>
    </Sidebar>
  );
}
