'use client';

import { useSession } from 'next-auth/react';
import { useUserStore } from '@/store/user-store';

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
