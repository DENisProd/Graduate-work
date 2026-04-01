'use client';

import { Header, Footer } from '@/components/layout';
import { ThemeInitializer } from '@/components/shared';
import { DevicesAdmin } from '@/components/features/admin/devices-admin';

export default function DevicesPage() {
  return (
    <>
      <ThemeInitializer />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
            <DevicesAdmin />
          </div>
        </main>
    </>
  );
}



