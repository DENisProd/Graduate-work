'use client';

import { useParams } from 'next/navigation';
import { DeviceFunctionActionsAdmin } from '@/components/features/admin/device-function-actions-admin';

export default function DeviceFunctionActionsForFunctionPage() {
  const params = useParams();
  const deviceId = params?.deviceId ? parseInt(params.deviceId as string) : null;
  const functionId = params?.functionId ? parseInt(params.functionId as string) : null;

  return <DeviceFunctionActionsAdmin deviceId={deviceId} functionId={functionId} />;
}
