'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useCanEditHouseRoles } from '@/hooks';
import { useAccessControlStore } from '@/store/access-control-store';
import { RolesTab } from '@/features/access-control/ui/house-details';

export default function HouseRolesPage() {
  const params = useParams();
  const houseIdParam = params?.houseId as string | undefined;
  const house = useAccessControlStore((s) => s.house);

  const houseId = useMemo(() => {
    if (house?.id != null) return String(house.id);
    if (!houseIdParam) return null;
    return houseIdParam;
  }, [house, houseIdParam]);

  const canEditRoles = useCanEditHouseRoles(houseId);

  return <RolesTab houseId={houseId} activeTab="roles" canEditRoles={canEditRoles} />;
}

