'use client';

import { useParams } from 'next/navigation';
import { useHousePageAccess, useHousePermissions } from '@/hooks';
import { useAccessControlStore } from '@/store/access-control-store';
import { ScenariosTab } from '@/features/access-control/ui/house-details';

export default function HouseScenariosPage() {
  const params = useParams();
  const houseId = (params?.houseId as string | undefined) ?? null;
  const house = useAccessControlStore((s) => s.house);
  const perms = useHousePermissions();
  const { canWrite } = useHousePageAccess({ ownerId: house?.ownerId });
  const canManage = perms.isOwner || perms.canManageAutomations || canWrite('scenarios');

  return (
    <ScenariosTab
      houseId={houseId}
      activeTab="scenarios"
      canManage={canManage}
      scenariosPathPrefix={
        houseId ? `/dashboard/houses/${encodeURIComponent(houseId)}/scenarios` : null
      }
    />
  );
}
