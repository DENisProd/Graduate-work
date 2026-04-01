'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useUserStore } from '@/store/user-store';

/** Syncs NextAuth session user id into user store so api-client can send X-User-Id. */
function SessionToUserStoreSync() {
  const { data: session, status } = useSession();
  const setUser = useUserStore((s) => s.setUser);
  const logout = useUserStore((s) => s.logout);

  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user?.id) {
      setUser({
        id: session.user.id,
        name: (session.user as { name?: string }).name ?? session.user.email ?? '',
        avatarUrl: (session.user as { image?: string }).image,
      });
    } else {
      logout();
    }
  }, [session?.user?.id, session?.user?.email, status, setUser, logout]);

  return null;
}

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <SessionToUserStoreSync />
      {children}
    </SessionProvider>
  );
}

