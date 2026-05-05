'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAccessControlStore } from '@/store/access-control-store';
import { DevicesTab } from '@/features/access-control/ui/house-details/devices/DevicesTab';

export default function HouseDevicesPage() {
  const params = useParams();
  const houseIdParam = params?.houseId as string | undefined;
  const house = useAccessControlStore((s) => s.house);

  const houseId = useMemo(() => {
    if (house?.id != null) return String(house.id);
    if (!houseIdParam) return null;
    return houseIdParam;
  }, [house, houseIdParam]);

  return <DevicesTab houseId={houseId} activeTab="devices" />;
}

