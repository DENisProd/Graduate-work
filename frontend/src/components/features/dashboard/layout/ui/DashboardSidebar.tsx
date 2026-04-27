'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@heroui/react';
import {
  Building2,
  ChevronUp,
  Home,
  LayoutDashboard,
  LogOut,
  Map,
  User,
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
import { DashboardIcon, CloseIcon } from './icons';

interface DashboardSidebarProps {
  routes: Route[];
  isActive: (href: string) => boolean;
  expandedGroups: Record<string, boolean>;
  toggleGroup: (group: string) => void;
  t: (key: Parameters<typeof import('@/lib/i18n').getTranslation>[1]) => string;
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

export function DashboardSidebar({
  routes,
  isActive,
  expandedGroups,
  toggleGroup,
  t,
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

export function buildDashboardRoutes(
  t: (key: Parameters<typeof import('@/lib/i18n').getTranslation>[1]) => string,
  selectedHouseId: string | null,
  selectedHouseName: string | null,
  pathname: string,
): Route[] {
  const houseSubs: NonNullable<Route['subs']> = [
    {
      title: t('dashboard.viewAll'),
      link: '/dashboard/houses',
      icon: <Home className="size-3.5" />,
      isActive: pathname === '/dashboard/houses',
    },
  ];

  if (selectedHouseId) {
    houseSubs.push(
      {
        title: selectedHouseName ?? `#${selectedHouseId}`,
        link: `/dashboard/houses/${selectedHouseId}`,
        icon: <Building2 className="size-3.5" />,
        isActive:
          pathname === `/dashboard/houses/${selectedHouseId}` &&
          !pathname.includes('/room-planner'),
      },
      {
        title: t('navigation.room_planner'),
        link: `/dashboard/houses/${selectedHouseId}/room-planner`,
        icon: <Map className="size-3.5" />,
        isActive: pathname.startsWith(
          `/dashboard/houses/${selectedHouseId}/room-planner`,
        ),
      },
    );
  }

  const housesSectionActive = pathname.startsWith('/dashboard/houses');

  return [
    {
      id: 'home',
      title: t('navigation.dashboard'),
      link: '/dashboard',
      icon: <LayoutDashboard className="size-4" />,
      section: t('navigation.overview'),
    },
    {
      id: 'houses',
      title: t('dashboard.myHouses'),
      link: '/dashboard/houses',
      icon: <Home className="size-4" />,
      section: t('navigation.properties'),
      subs: houseSubs,
      isActive: housesSectionActive,
    },
  ];
}
