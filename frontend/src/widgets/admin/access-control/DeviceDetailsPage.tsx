'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DeviceDetails } from '@/features/access-control/ui/device-details/DeviceDetails';

export default function DeviceDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const houseId = useMemo(() => {
    const raw = params?.houseId as string | undefined;
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }, [params]);

  const deviceId = params?.deviceId as string | undefined;

  if (!houseId || !deviceId) {
    router.push('/admin/access-control/houses');
    return null;
  }

  return <DeviceDetails houseId={houseId} deviceId={deviceId} />;
}

