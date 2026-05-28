'use client';

import { usePathname } from 'next/navigation';
import { SharedElementTransition } from 'react-aria-components';
import { Header } from '@/components/layout';
import { Footer7 } from '@/components/ui/footer-7';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard');

  if (isAdmin) {
    return <SharedElementTransition>{children}</SharedElementTransition>;
  }

  return (
    <SharedElementTransition>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer7 />
      </div>
    </SharedElementTransition>
  );
}
