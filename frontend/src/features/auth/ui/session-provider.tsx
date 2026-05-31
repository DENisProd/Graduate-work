'use client';

import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import { useUserStore } from '@/store/user-store';

/** Syncs NextAuth session user id into user store so api-client can send X-User-Id. */
function SessionToUserStoreSync() {
  const { data: session, status } = useSession();
  const setUser = useUserStore((s) => s.setUser);
  const setAccessToken = useUserStore((s) => s.setAccessToken);
  const logout = useUserStore((s) => s.logout);
  const isSigningOutRef = useRef(false);

  const sessionAny = session as (typeof session & { accessToken?: string | null; error?: string | null }) | null;
  const accessToken = sessionAny?.accessToken;
  const sessionError = sessionAny?.error;

  useEffect(() => {
    if (status === 'loading') return;

    // Refresh token failed — sign out (clears stale cookie) then redirect to sign-in.
    // Guard prevents React Strict Mode double-invoke from firing two sign-outs.
    if (sessionError === 'RefreshAccessTokenError') {
      if (!isSigningOutRef.current) {
        isSigningOutRef.current = true;
        void signOut({ callbackUrl: '/auth/signin' });
      }
      return;
    }

    isSigningOutRef.current = false;

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

