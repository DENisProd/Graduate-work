'use client';

import { useParams } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import { ThemeInitializer } from '@/components/shared';
import { DeviceFunctionsAdmin } from '@/components/features/admin/device-functions-admin';

export default function DeviceFunctionsPage() {
  const params = useParams();
  const deviceId = params?.deviceId ? parseInt(params.deviceId as string) : null;

  return (
    <>
      <ThemeInitializer />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
            <DeviceFunctionsAdmin deviceId={deviceId} />
          </div>
        </main>
    </>
  );
}



