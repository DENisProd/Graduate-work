'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks';
import { devicesApi, housesApi } from '@/lib/api-client';
import type { GroupKey, NavItem } from './types';
import {
  DevicesIcon,
  TypesIcon,
  CategoriesIcon,
  RoomsIcon,
} from '../ui/icons';

export function useAdminLayout() {
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedDeviceName, setSelectedDeviceName] = useState<string | null>(
    null,
  );
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null);
  const [selectedHouseName, setSelectedHouseName] = useState<string | null>(
    null,
  );

  const isInGroup = (group: GroupKey): boolean => {
    if (group === 'devices') return pathname.startsWith('/admin/devices');
    if (group === 'reference')
      return (
        pathname.startsWith('/admin/device-types') ||
        pathname.startsWith('/admin/device-categories')
      );
    if (group === 'security')
      return pathname.startsWith('/admin/access-control');
    return false;
  };

  const [expandedGroups, setExpandedGroups] = useState<
    Record<GroupKey, boolean>
  >(() => ({
    devices: true,
    reference: true,
    security: true,
  }));

  const toggleGroup = (group: GroupKey) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const deviceIdFromPath =
    pathname.match(/^\/admin\/devices\/(\d+)/)?.[1] ?? null;
  const houseIdFromPath =
    pathname.match(/^\/admin\/access-control\/houses\/(\d+)/)?.[1] ?? null;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (deviceIdFromPath) {
        setSelectedDeviceId(deviceIdFromPath);
        devicesApi
          .getById(Number(deviceIdFromPath))
          .then((device) => {
            const tr = device.translations as
              | Record<string, { name?: string }>
              | undefined;
            const name =
              tr?.[locale]?.name ??
              device.name ??
              tr?.ru?.name ??
              tr?.en?.name ??
              device.code;
            setSelectedDeviceName(name || device.code);
          })
          .catch(() => setSelectedDeviceName(null));
      } else {
        setSelectedDeviceId(null);
        setSelectedDeviceName(null);
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [deviceIdFromPath, locale]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (houseIdFromPath) {
        setSelectedHouseId(houseIdFromPath);
        housesApi
          .getById(Number(houseIdFromPath))
          .then((house) => setSelectedHouseName(house.name ?? null))
          .catch(() => setSelectedHouseName(null));
      } else {
        setSelectedHouseId(null);
        setSelectedHouseName(null);
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [houseIdFromPath]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const group: GroupKey | null = isInGroup('devices')
        ? 'devices'
        : isInGroup('reference')
          ? 'reference'
          : isInGroup('security')
            ? 'security'
            : null;
      if (group) {
        setExpandedGroups((prev) => ({ ...prev, [group]: true }));
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  const navItems: NavItem[] = [
    {
      href: '/admin/devices',
      label: t('admin.tabs.devices'),
      icon: DevicesIcon,
      group: 'devices',
    },
    {
      href: '/admin/device-types',
      label: t('admin.tabs.deviceTypes'),
      icon: TypesIcon,
      group: 'reference',
    },
    {
      href: '/admin/device-categories',
      label: t('admin.tabs.deviceCategories'),
      icon: CategoriesIcon,
      group: 'reference',
    },
    {
      href: '/admin/access-control/houses',
      label: t('admin.accessControl.houses'),
      icon: RoomsIcon,
      group: 'security',
    },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === href;
    return pathname.startsWith(href);
  };

  const isFullWidthPage = pathname.includes('/room-planner');

  // Automatically collapse sidebar on full-width pages if not already collapsed
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isFullWidthPage && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [isFullWidthPage]);

  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-64';
  const sidebarWidthPx = sidebarCollapsed ? 64 : 256;

  return {
    t,
    pathname,
    sidebarCollapsed,
    setSidebarCollapsed,
    sidebarOpen,
    setSidebarOpen,
    expandedGroups,
    toggleGroup,
    navItems,
    isActive,
    selectedDeviceId,
    selectedDeviceName,
    selectedHouseId,
    selectedHouseName,
    sidebarWidth,
    sidebarWidthPx,
    isFullWidthPage,
  };
}
