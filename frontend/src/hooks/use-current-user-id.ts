'use client';

import { useSession } from 'next-auth/react';
import { useUserStore } from '@/store/user-store';

/**
 * Returns current user id for "my houses" / dashboard context.
 * Prefers NextAuth session (Keycloak); falls back to mock user from store.
 * API houses/getByOwner expects string (UUID).
 */
export function useCurrentUserId(): string | null {
  const { data: session, status } = useSession();
  const storeUser = useUserStore((s) => s.user);

  if (status === 'loading') {
    return null;
  }

  if (session?.user?.id) {
    return session.user.id;
  }

  if (storeUser?.id != null) {
    return String(storeUser.id);
  }

  return null;
}
