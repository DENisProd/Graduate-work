'use client';

import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { HouseDetailsModals } from '@/features/access-control';
import { HouseDetailsWidget } from '@/widgets/house-details';
import { useAccessControlStore } from '@/store/access-control-store';
import { useCurrentUserId } from '@/hooks';

export function DashboardHouseDetails() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: sessionStatus } = useSession();
  const currentUserId = useCurrentUserId();

  const houseIdParam = params?.houseId as string | undefined;
  const houseId = houseIdParam && houseIdParam.length > 0 ? houseIdParam : null;

  const setHouseId = useAccessControlStore((s) => s.setHouseId);
  const setOwnerIdFromUrl = useAccessControlStore((s) => s.setOwnerIdFromUrl);
  const setActiveTab = useAccessControlStore((s) => s.setActiveTab);
  const loadAll = useAccessControlStore((s) => s.loadAll);
  const reset = useAccessControlStore((s) => s.reset);

  useEffect(() => {
    if (!houseId || currentUserId == null) return;
    setHouseId(houseId);
    setOwnerIdFromUrl(currentUserId);
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) setActiveTab(tabFromUrl);
    loadAll();
    return () => reset();
  }, [houseId, currentUserId, setHouseId, setOwnerIdFromUrl, setActiveTab, loadAll, reset]);

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
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  const onRoomPlanner = () => {
    if (houseIdParam) {
      router.push(`/dashboard/houses/${houseIdParam}/room-planner`);
    }
  };

  return (
    <>
      <HouseDetailsWidget
        houseIdParam={houseIdParam}
        onRoomPlanner={onRoomPlanner}
        isAdmin={false}
      />
      <HouseDetailsModals />
    </>
  );
}
