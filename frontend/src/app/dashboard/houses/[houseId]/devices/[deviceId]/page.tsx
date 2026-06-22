'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DeviceDetails } from '@/features/access-control/ui/device-details/DeviceDetails';
import { useHousePermissions, useTranslation } from '@/hooks';

function paramToString(value: string | string[] | undefined): string | null {
  if (value == null) return null;
  const s = Array.isArray(value) ? value[0] : value;
  return s != null && String(s).length > 0 ? String(s) : null;
}

export default function DashboardDeviceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const perms = useHousePermissions();
  const canRefreshData = perms.isOwner || perms.canManageDevices;

  const houseId = useMemo(() => paramToString(params?.houseId), [params]);
  const deviceId = useMemo(() => paramToString(params?.deviceId), [params]);

  if (!houseId || !deviceId) {
    router.push('/dashboard/houses');
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <DeviceDetails
        houseId={houseId}
        deviceId={deviceId}
        backHref={`/dashboard/houses/${encodeURIComponent(houseId)}/devices`}
        backLabel={t('common.back')}
        canRefreshData={canRefreshData}
      />
    </div>
  );
}

