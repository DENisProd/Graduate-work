'use client';

import Link from 'next/link';
import { Button } from '@heroui/react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AccountBlock } from '@/features/auth';
import { NotificationsPopover } from '@/components/sidebar-02/nav-notifications';
import DashboardNavigation, { type Route } from '@/components/sidebar-02/nav-main';
import {
  DashboardIcon,
  HousesIcon,
  RoomPlannerIcon,
  CloseIcon,
} from './icons';

interface DashboardSidebarProps {
  routes: Route[];
  isActive: (href: string) => boolean;
  expandedGroups: Record<string, boolean>;
  toggleGroup: (group: string) => void;
  t: (key: Parameters<typeof import('@/lib/i18n').getTranslation>[1]) => string;
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
  const notifications = [
    {
      id: '1',
      avatar: '/avatars/01.png',
      fallback: 'OM',
      text: 'New order received.',
      time: '10m ago',
    },
    {
      id: '2',
      avatar: '/avatars/02.png',
      fallback: 'JL',
      text: 'Server upgrade completed.',
      time: '1h ago',
    },
  ];

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader
        className={cn(
          'flex px-2 py-3 md:pt-3.5',
          isCollapsed
            ? 'flex-row items-center justify-between gap-y-4 md:flex-col md:items-start md:justify-start'
            : 'flex-row items-center justify-between',
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
        >
          <DashboardIcon className="h-6 w-6 shrink-0 text-accent" />
          {!isCollapsed && (
            <h2 className="whitespace-nowrap text-lg font-semibold">
              {t('header.title')}
            </h2>
          )}
        </Link>
        <motion.div
          key={isCollapsed ? 'header-collapsed' : 'header-expanded'}
          className={cn(
            'flex items-center gap-2',
            isCollapsed ? 'flex-row md:flex-col-reverse' : 'flex-row',
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <SidebarTrigger />
          {isMobile && (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={() => setOpenMobile(false)}
              className="md:hidden"
            >
              <CloseIcon className="h-5 w-5" />
            </Button>
          )}
        </motion.div>
      </SidebarHeader>

      <SidebarContent className="gap-2 px-2 py-4">
        <DashboardNavigation
          routes={routes}
          isActive={isActive}
          openGroups={expandedGroups}
          onToggleGroup={toggleGroup}
        />
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="mt-auto px-2 pb-3">
        <div className="flex w-full items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&_button]:min-w-0 group-data-[collapsible=icon]:[&_button]:w-10 group-data-[collapsible=icon]:[&_button]:justify-center group-data-[collapsible=icon]:[&_span]:hidden">
          <NotificationsPopover notifications={notifications} />
          <AccountBlock />
        </div>
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
      title: t('dashboard.myHouses'),
      link: '/dashboard/houses',
      icon: <HousesIcon className="size-4" />,
      isActive: pathname === '/dashboard/houses',
    },
  ];

  if (selectedHouseId) {
    houseSubs.push(
      {
        title: selectedHouseName ?? `#${selectedHouseId}`,
        link: `/dashboard/houses/${selectedHouseId}`,
        icon: <HousesIcon className="size-4" />,
        isActive:
          pathname === `/dashboard/houses/${selectedHouseId}` &&
          !pathname.includes('/room-planner'),
      },
      {
        title: t('navigation.room_planner'),
        link: `/dashboard/houses/${selectedHouseId}/room-planner`,
        icon: <RoomPlannerIcon className="size-4" />,
        isActive: pathname.startsWith(
          `/dashboard/houses/${selectedHouseId}/room-planner`,
        ),
      },
    );
  }

  return [
    {
      id: 'home',
      title: t('navigation.dashboard'),
      link: '/dashboard',
      icon: <DashboardIcon className="size-4" />,
    },
    {
      id: 'houses',
      title: t('dashboard.myHouses'),
      link: '/dashboard/houses',
      icon: <HousesIcon className="size-4" />,
      subs: houseSubs,
    },
  ];
}
