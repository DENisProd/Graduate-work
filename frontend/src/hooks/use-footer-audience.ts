'use client';

import { useSession } from 'next-auth/react';
import type { FooterAudience } from '@/lib/auth/footer-audience';
import { hasPlatformAdminRole } from '@/lib/auth/jwt-roles';

export type { FooterAudience } from '@/lib/auth/footer-audience';
export { isFooterLinkVisible } from '@/lib/auth/footer-audience';

export function useFooterAudience(): {
  audience: FooterAudience;
  isLoading: boolean;
  isAuthenticated: boolean;
} {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  if (isLoading || !session?.user) {
    return { audience: 'guest', isLoading, isAuthenticated: false };
  }

  if (hasPlatformAdminRole(session.accessToken)) {
    return { audience: 'platformAdmin', isLoading: false, isAuthenticated: true };
  }

  return { audience: 'user', isLoading: false, isAuthenticated: true };
}
