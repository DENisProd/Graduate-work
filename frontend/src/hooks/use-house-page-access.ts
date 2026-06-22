'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { housesApi } from '@/lib/api/access-service';
import {
  allPagesAllowed,
  emptyPageAccess,
  type HousePageAccess,
  type HousePageSlug,
} from '@/lib/house-pages';
import { useCurrentUserId } from './use-current-user-id';
import { useAccessControlStore } from '@/store/access-control-store';

export interface UseHousePageAccessOptions {
  /** House owner external id (e.g. from user houses list when store is not loaded yet). */
  ownerId?: string | null;
  /** Keycloak platform admin — full access to all house pages. */
  isPlatformAdmin?: boolean;
}

export function useHousePageAccess(options?: UseHousePageAccessOptions): {
  pageAccess: HousePageAccess | null;
  loading: boolean;
  canRead: (slug: HousePageSlug) => boolean;
  canWrite: (slug: HousePageSlug) => boolean;
} {
  const params = useParams();
  const houseId = (params?.houseId as string | undefined) ?? null;
  const currentUserId = useCurrentUserId();
  const house = useAccessControlStore((s) => s.house);
  const [pageAccess, setPageAccess] = useState<HousePageAccess | null>(null);
  const [loading, setLoading] = useState(false);

  const isOwner = Boolean(
    currentUserId &&
      ((house?.ownerId && house.ownerId === currentUserId) ||
        (options?.ownerId && options.ownerId === currentUserId)),
  );
  const fullAccess = isOwner || Boolean(options?.isPlatformAdmin);

  useEffect(() => {
    if (!houseId || !currentUserId) {
      setPageAccess(null);
      setLoading(false);
      return;
    }
    if (fullAccess) {
      setPageAccess(allPagesAllowed());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setPageAccess(null);
    setLoading(true);
    void housesApi
      .getPageAccess(houseId)
      .then((data) => {
        if (cancelled) return;
        const merged = emptyPageAccess();
        for (const slug of Object.keys(merged) as HousePageSlug[]) {
          const entry = data[slug];
          merged[slug] = entry ?? { read: false, write: false };
        }
        setPageAccess(merged);
      })
      .catch(() => {
        if (!cancelled) setPageAccess(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [houseId, currentUserId, fullAccess]);

  const canRead = useMemo(
    () => (slug: HousePageSlug) => {
      if (fullAccess) return true;
      if (loading || !pageAccess) return true;
      return pageAccess[slug]?.read ?? false;
    },
    [fullAccess, loading, pageAccess],
  );

  const canWrite = useMemo(
    () => (slug: HousePageSlug) => {
      if (fullAccess) return true;
      if (loading || !pageAccess) return false;
      return pageAccess[slug]?.write ?? false;
    },
    [fullAccess, loading, pageAccess],
  );

  return { pageAccess, loading, canRead, canWrite };
}
