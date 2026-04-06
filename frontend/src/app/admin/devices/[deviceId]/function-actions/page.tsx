'use client';

import { useParams } from 'next/navigation';
import { DeviceFunctionActionsAdmin } from '@/components/features/admin/device-function-actions-admin';

export default function DeviceFunctionActionsPage() {
  const params = useParams();
  const deviceId = params?.deviceId ? parseInt(params.deviceId as string) : null;

  return <DeviceFunctionActionsAdmin deviceId={deviceId} />;
}
