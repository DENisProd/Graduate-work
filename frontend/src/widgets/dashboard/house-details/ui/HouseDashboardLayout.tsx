'use client';

import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { HouseDetailsModals } from '@/features/access-control';
import { HouseDetailsHeader } from '@/features/access-control/ui/house-details';
import { useAccessControlStore, normalizeHouseDetailsTab } from '@/store/access-control-store';
import { useCurrentUserId, useTranslation } from '@/hooks';
import { getHouseRole } from '@/components/ui/role-badge';

const HOUSE_SECTIONS = new Set(['rooms', 'members', 'roles', 'devices', 'scenarios']);

function shouldShowHouseDetailsHeader(pathname: string): boolean {
  if (pathname.includes('/room-planner')) return false;
  if (/\/dashboard\/houses\/[^/]+\/devices\/.+/.test(pathname)) return false;
  return /^\/dashboard\/houses\/[^/]+(\/(rooms|members|roles|devices|scenarios))?$/.test(pathname);
}

export function HouseDashboardLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status: sessionStatus } = useSession();
  const currentUserId = useCurrentUserId();
  const { t } = useTranslation();

  const houseIdParam = params?.houseId as string | undefined;
  const houseId = houseIdParam && houseIdParam.length > 0 ? houseIdParam : null;

  const house = useAccessControlStore((s) => s.house);
  const setHouseId = useAccessControlStore((s) => s.setHouseId);
  const setOwnerIdFromUrl = useAccessControlStore((s) => s.setOwnerIdFromUrl);
  const setActiveTab = useAccessControlStore((s) => s.setActiveTab);
  const loadAll = useAccessControlStore((s) => s.loadAll);
  const reset = useAccessControlStore((s) => s.reset);

  useEffect(() => {
    if (!houseId || currentUserId == null) return;
    setHouseId(houseId);
    setOwnerIdFromUrl(currentUserId);
    loadAll();
    return () => reset();
  }, [houseId, currentUserId, setHouseId, setOwnerIdFromUrl, loadAll, reset]);

  useEffect(() => {
    if (!houseIdParam) return;
    const tab = searchParams.get('tab');
    if (!tab) return;
    const normalized = normalizeHouseDetailsTab(tab);
    router.replace(`/dashboard/houses/${encodeURIComponent(houseIdParam)}/${normalized}`);
  }, [houseIdParam, searchParams, router]);

  useEffect(() => {
    const m = pathname.match(
      /^\/dashboard\/houses\/[^/]+\/(rooms|members|roles|devices|scenarios)(?:\/|$)/,
    );
    if (m?.[1] && HOUSE_SECTIONS.has(m[1])) setActiveTab(m[1]);
  }, [pathname, setActiveTab]);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (currentUserId === null) {
      router.replace('/dashboard');
      return;
    }
    if (!houseId) {
      router.replace('/dashboard/houses');
    }
  }, [sessionStatus, currentUserId, houseId, router]);

  const currentUserRole =
    house?.ownerId && currentUserId ? getHouseRole(house.ownerId, currentUserId) : 'member';

  const showHeader = shouldShowHouseDetailsHeader(pathname);

  if (sessionStatus !== 'loading' && currentUserId === null) {
    return null;
  }

  if (!houseId) {
    return null;
  }

  if (sessionStatus === 'loading' || currentUserId == null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {showHeader && (
          <HouseDetailsHeader
            houseName={house?.name || t('admin.accessControl.houses')}
            role={currentUserRole}
            isAdmin={false}
            ownerId={house?.ownerId}
          />
        )}
        {children}
      </div>
      <HouseDetailsModals />
    </>
  );
}

