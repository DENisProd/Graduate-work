'use client';

import { SessionProvider, useSession, signIn } from 'next-auth/react';
import { useEffect } from 'react';
import { useUserStore } from '@/store/user-store';

/** Syncs NextAuth session user id into user store so api-client can send X-User-Id. */
function SessionToUserStoreSync() {
  const { data: session, status } = useSession();
  const setUser = useUserStore((s) => s.setUser);
  const setAccessToken = useUserStore((s) => s.setAccessToken);
  const logout = useUserStore((s) => s.logout);

  const sessionAny = session as (typeof session & { accessToken?: string | null; error?: string | null }) | null;
  const accessToken = sessionAny?.accessToken;
  const sessionError = sessionAny?.error;

  useEffect(() => {
    if (status === 'loading') return;

    // Refresh token failed — force re-login
    if (sessionError === 'RefreshAccessTokenError') {
      void signIn('keycloak');
      return;
    }

    if (session?.user?.id) {
      setUser({
        id: session.user.id,
        name: (session.user as { name?: string }).name ?? session.user.email ?? '',
        avatarUrl: (session.user as { image?: string }).image,
      });
      setAccessToken(accessToken ?? null);
    } else {
      logout();
    }
  }, [session?.user?.id, session?.user?.email, accessToken, sessionError, status, setUser, setAccessToken, logout]);

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

