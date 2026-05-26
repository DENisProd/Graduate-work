'use client';

import { useParams } from 'next/navigation';
import { useHousePermissions } from '@/hooks';
import { DevicesTab } from '@/features/access-control/ui/house-details/devices/DevicesTab';

export default function HouseDevicesPage() {
  const params = useParams();
  const houseId = (params?.houseId as string | undefined) ?? null;
  const perms = useHousePermissions();

  return (
    <DevicesTab
      houseId={houseId}
      activeTab="devices"
      canManage={perms.isOwner || perms.canManageDevices}
      detailsPathPrefix={
        houseId ? `/dashboard/houses/${encodeURIComponent(houseId)}/devices` : null
      }
    />
  );
}
