'use client';

import { usePathname } from 'next/navigation';
import { SharedElementTransition } from 'react-aria-components';
import { Header, Footer } from '@/components/layout';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard');

  return (
    <SharedElementTransition>
      <div className="flex min-h-screen flex-col">
        {!isAdmin && <Header />}
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </SharedElementTransition>
  );
}
