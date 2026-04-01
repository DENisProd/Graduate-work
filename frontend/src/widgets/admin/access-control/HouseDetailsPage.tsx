'use client';

import { useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { HouseDetailsModals } from '@/features/access-control';
import { HouseDetailsWidget } from '@/widgets/house-details';
import { useAccessControlStore } from '@/store/access-control-store';

export default function HouseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const houseId = params?.houseId as string | undefined;
  const ownerIdFromUrl = useMemo(() => {
    const v = searchParams?.get('ownerId');
    return v ? v : undefined;
  }, [searchParams]);
  const houseIdParam = params?.houseId as string | undefined;

  const setHouseId = useAccessControlStore((s) => s.setHouseId);
  const setOwnerIdFromUrl = useAccessControlStore((s) => s.setOwnerIdFromUrl);
  const loadAll = useAccessControlStore((s) => s.loadAll);
  const reset = useAccessControlStore((s) => s.reset);

  useEffect(() => {
    if (!houseId) return;
    setHouseId(houseId);
    setOwnerIdFromUrl(ownerIdFromUrl);
    loadAll();
    return () => reset();
  }, [houseId, ownerIdFromUrl, setHouseId, setOwnerIdFromUrl, loadAll, reset]);

  if (!houseId) {
    router.push('/admin/access-control/houses');
    return null;
  }

  const onRoomPlanner = () => {
    if (houseIdParam) {
      router.push(`/admin/access-control/houses/${houseIdParam}/room-planner`);
    }
  };

  return (
    <>
      <HouseDetailsWidget houseIdParam={houseIdParam} onRoomPlanner={onRoomPlanner} isAdmin />
      <HouseDetailsModals />
    </>
  );
}
