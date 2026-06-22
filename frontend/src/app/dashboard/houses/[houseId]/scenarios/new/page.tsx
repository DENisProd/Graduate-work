'use client';

import { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ScenarioEditor } from '@/features/access-control/ui/scenario-editor/ScenarioEditor';
import { useHousePageAccess, useHousePermissions } from '@/hooks';
import { useAccessControlStore } from '@/store/access-control-store';

function paramToString(value: string | string[] | undefined): string | null {
  if (value == null) return null;
  const s = Array.isArray(value) ? value[0] : value;
  return s != null && String(s).length > 0 ? String(s) : null;
}

export default function DashboardScenarioCreatePage() {
  const params = useParams();
  const router = useRouter();
  const house = useAccessControlStore((s) => s.house);
  const perms = useHousePermissions();
  const { canWrite } = useHousePageAccess({ ownerId: house?.ownerId });

  const houseId = useMemo(() => paramToString(params?.houseId), [params]);
  const canManage = perms.isOwner || perms.canManageAutomations || canWrite('scenarios');

  useEffect(() => {
    if (houseId && !canManage) {
      router.replace(`/dashboard/houses/${encodeURIComponent(houseId)}/scenarios`);
    }
  }, [canManage, houseId, router]);

  if (!houseId) {
    router.push('/dashboard/houses');
    return null;
  }

  if (!canManage) {
    return null;
  }

  return (
    <ScenarioEditor
      mode="create"
      houseId={houseId}
      returnHref={`/dashboard/houses/${encodeURIComponent(houseId)}/scenarios`}
    />
  );
}
