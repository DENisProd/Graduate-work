'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DeviceDetails } from '@/features/access-control/ui/device-details/DeviceDetails';

function paramToString(value: string | string[] | undefined): string | null {
  if (value == null) return null;
  const s = Array.isArray(value) ? value[0] : value;
  return s != null && String(s).length > 0 ? String(s) : null;
}

export default function DeviceDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const houseId = useMemo(() => paramToString(params?.houseId), [params]);

  const deviceId = useMemo(() => paramToString(params?.deviceId), [params]);

  if (!houseId || !deviceId) {
    router.push('/admin/access-control/houses');
    return null;
  }

  return <DeviceDetails houseId={houseId} deviceId={deviceId} />;
}

