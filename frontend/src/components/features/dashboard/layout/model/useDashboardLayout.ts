'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCurrentUserId, useTranslation } from '@/hooks';
import { housesApi } from '@/lib/api-client';
import { toArray } from '@/features/access-control';
import { env } from '@/config/env.config';
import type { HouseResponse } from '@/types/api';

type SessionWithToken = { accessToken?: string | null };

export function useDashboardLayout() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const currentUserId = useCurrentUserId();
  const { data: session } = useSession();
  const sessionToken = (session as SessionWithToken | null)?.accessToken ?? null;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    houses: true,
  });
  const [userHouses, setUserHouses] = useState<HouseResponse[]>([]);
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null);
  const [selectedHouseName, setSelectedHouseName] = useState<string | null>(
    null,
  );

  const houseIdFromPath = pathname.match(/^\/dashboard\/houses\/([^/]+)/)?.[1] ?? null;

  useEffect(() => {
    if (!currentUserId || !sessionToken) {
      if (!currentUserId) setUserHouses([]);
      return;
    }

    const url = `${env.ACCESS_API_BASE_URL}/v1/houses/user/${encodeURIComponent(currentUserId)}?page=0&size=10`;

    fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
        'X-User-Id': currentUserId,
      },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data) => setUserHouses(toArray<HouseResponse>(data as any)))
      .catch((err: unknown) => {
        console.error('[Dashboard] Failed to load houses:', err);
        setUserHouses([]);
      });
  }, [currentUserId, sessionToken]);

  useEffect(() => {
    if (houseIdFromPath) {
      setSelectedHouseId(houseIdFromPath);
      const decodedHouseId = decodeURIComponent(houseIdFromPath);
      const matchedHouse = userHouses.find(
        (house) =>
          String(house.id) === decodedHouseId || house.uuid === decodedHouseId,
      );

      if (matchedHouse) {
        setSelectedHouseName(matchedHouse.name ?? null);
        return;
      }

      housesApi
        .getById(decodedHouseId)
        .then((house) => setSelectedHouseName(house.name ?? null))
        .catch(() => setSelectedHouseName(null));
    } else {
      setSelectedHouseId(null);
      setSelectedHouseName(null);
    }
  }, [houseIdFromPath, userHouses]);

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
    userHouses,
    isFullWidthPage,
  };
}
