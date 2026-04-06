'use client';

import { useParams } from 'next/navigation';
import { DeviceFunctionsAdmin } from '@/components/features/admin/device-functions-admin';

export default function DeviceFunctionsPage() {
  const params = useParams();
  const deviceId = params?.deviceId ? parseInt(params.deviceId as string) : null;

  return <DeviceFunctionsAdmin deviceId={deviceId} />;
}
