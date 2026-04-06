'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks';
import { housesApi } from '@/lib/api-client';

export function useDashboardLayout() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    houses: true,
  });
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null);
  const [selectedHouseName, setSelectedHouseName] = useState<string | null>(
    null,
  );

  const houseIdFromPath =
    pathname.match(/^\/dashboard\/houses\/(\d+)/)?.[1] ?? null;

  useEffect(() => {
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
  }, [houseIdFromPath]);

  useEffect(() => {
    if (pathname.startsWith('/dashboard/houses')) {
      setExpandedGroups((prev) => ({ ...prev, houses: true }));
    }
  }, [pathname]);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  const isFullWidthPage = pathname.includes('/room-planner');

  useEffect(() => {
    if (isFullWidthPage && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  }, [isFullWidthPage]);

  return {
    t,
    pathname,
    sidebarCollapsed,
    setSidebarCollapsed,
    expandedGroups,
    toggleGroup,
    isActive,
    selectedHouseId,
    selectedHouseName,
    isFullWidthPage,
  };
}
