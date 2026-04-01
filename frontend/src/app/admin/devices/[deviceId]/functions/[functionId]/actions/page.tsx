'use client';

import { useParams } from 'next/navigation';
import { ThemeInitializer } from '@/components/shared';
import { DeviceFunctionActionsAdmin } from '@/components/features/admin/device-function-actions-admin';

export default function DeviceFunctionActionsForFunctionPage() {
  const params = useParams();
  const deviceId = params?.deviceId ? parseInt(params.deviceId as string) : null;
  const functionId = params?.functionId ? parseInt(params.functionId as string) : null;

  return (
    <>
      <ThemeInitializer />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
          <DeviceFunctionActionsAdmin deviceId={deviceId} functionId={functionId} />
        </div>
      </main>
    </>
  );
}
