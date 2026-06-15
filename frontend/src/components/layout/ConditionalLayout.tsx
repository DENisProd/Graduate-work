'use client';

import { usePathname } from 'next/navigation';
import { SharedElementTransition } from 'react-aria-components';
import { Header } from '@/components/layout';
import { LandingFooter } from './landing-footer';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAppPage = pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard');

  if (isAppPage) {
    return <SharedElementTransition>{children}</SharedElementTransition>;
  }

  return (
    <SharedElementTransition>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <LandingFooter />
      </div>
    </SharedElementTransition>
  );
}
