'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { HouseDetailsModals } from '@/features/access-control';
import { HouseDetailsWidget } from '@/widgets/house-details';
import { useAccessControlStore } from '@/store/access-control-store';
import { useCurrentUserId } from '@/hooks';
import { ThemeInitializer } from '@/components/shared';

export function DashboardHouseDetails() {
  const params = useParams();
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const currentUserId = useCurrentUserId();

  const houseIdParam = params?.houseId as string | undefined;
  const houseId = houseIdParam && houseIdParam.length > 0 ? houseIdParam : null;

  const setHouseId = useAccessControlStore((s) => s.setHouseId);
  const setOwnerIdFromUrl = useAccessControlStore((s) => s.setOwnerIdFromUrl);
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
    if (sessionStatus === 'loading') return;
    if (currentUserId === null) {
      router.replace('/dashboard');
      return;
    }
    if (!houseId) {
      router.replace('/dashboard/houses');
    }
  }, [sessionStatus, currentUserId, houseId, router]);

  if (sessionStatus !== 'loading' && currentUserId === null) {
    return null;
  }

  if (!houseId) {
    return null;
  }

  if (sessionStatus === 'loading' || currentUserId == null) {
    return (
      <>
        <ThemeInitializer />
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      </>
    );
  }

  const onRoomPlanner = () => {
    if (houseIdParam) {
      router.push(`/dashboard/houses/${houseIdParam}/room-planner`);
    }
  };

  return (
    <>
      <ThemeInitializer />
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <HouseDetailsWidget
          houseIdParam={houseIdParam}
          onRoomPlanner={onRoomPlanner}
          isAdmin={false}
        />
        <HouseDetailsModals />
      </div>
    </>
  );
}
