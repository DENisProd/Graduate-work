'use client';

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
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AccountBlock } from '@/features/auth';
import { NotificationsPopover } from '@/components/sidebar-02/nav-notifications';
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

export function AdminSidebar({
  navItems,
  isActive,
  expandedGroups,
  toggleGroup,
  selectedDeviceId,
  selectedHouseId,
  selectedHouseName,
  pathname,
  t,
}: AdminSidebarProps) {
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
    {
      id: '3',
      avatar: '/avatars/03.png',
      fallback: 'HH',
      text: 'New user signed up.',
      time: '2h ago',
    },
  ];

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
          'flex px-2 py-3 md:pt-3.5',
          isCollapsed
            ? 'flex-row items-center justify-between gap-y-4 md:flex-col md:items-start md:justify-start'
            : 'flex-row items-center justify-between',
        )}
      >
        <AppLogo
          label={t('header.title')}
          className={cn(
            'text-sm font-medium text-foreground/60 hover:text-foreground',
            isCollapsed && 'md:w-full md:justify-center',
          )}
          labelClassName="whitespace-nowrap text-lg font-semibold"
          showLabel={!isCollapsed}
        />
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
          onToggleGroup={handleToggleGroup}
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
