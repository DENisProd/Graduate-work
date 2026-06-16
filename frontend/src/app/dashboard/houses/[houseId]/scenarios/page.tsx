'use client';

import { useParams } from 'next/navigation';
import { useHousePermissions } from '@/hooks';
import { ScenariosTab } from '@/features/access-control/ui/house-details';

export default function HouseScenariosPage() {
  const params = useParams();
  const houseId = (params?.houseId as string | undefined) ?? null;
  const perms = useHousePermissions();

  return (
    <ScenariosTab
      houseId={houseId}
      activeTab="scenarios"
      canManage={perms.isOwner || perms.canManageAutomations}
      scenariosPathPrefix={
        houseId ? `/dashboard/houses/${encodeURIComponent(houseId)}/scenarios` : null
      }
    />
  );
}
