import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

type TokenWithKeycloakSub = {
  sub?: string;
  keycloakSub?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: string;
  roles?: string[];
};

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
  } catch {
    return {};
  }
}

type KeycloakProfileLike = {
  sub?: string;
  id?: string;
};

async function refreshKeycloakToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const issuer = process.env.AUTH_KEYCLOAK_ISSUER!;
  const tokenUrl = `${issuer}/protocol/openid-connect/token`;

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.AUTH_KEYCLOAK_ID!,
    client_secret: process.env.AUTH_KEYCLOAK_SECRET!,
    refresh_token: refreshToken,
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Token refresh failed ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json();
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID!,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET!,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER!,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    session({ session, token }) {
      if (session.user) {
        const kcSub = (token as TokenWithKeycloakSub).keycloakSub;
        session.user.id = kcSub ?? token.sub ?? "";
      }
      session.accessToken = (token as TokenWithKeycloakSub).accessToken ?? null;
      session.error = (token as TokenWithKeycloakSub).error ?? null;
      session.roles = (token as TokenWithKeycloakSub).roles ?? [];
      return session;
    },
    async jwt({ token, account, profile }) {
      const tokenData = token as TokenWithKeycloakSub;

      if (account?.provider === 'keycloak') {
        const profileData = profile as KeycloakProfileLike | undefined;
        const profileSub = profileData?.sub ?? profileData?.id;
        const stableSub = profileSub ?? account.providerAccountId ?? tokenData.keycloakSub ?? token.sub;

        if (stableSub) {
          tokenData.keycloakSub = stableSub;
          token.sub = stableSub;
        }
        tokenData.accessToken = account.access_token;
        tokenData.refreshToken = account.refresh_token;
        if (account.access_token) {
          const payload = decodeJwtPayload(account.access_token);
          const realmAccess = payload?.realm_access as { roles?: string[] } | undefined;
          tokenData.roles = realmAccess?.roles ?? [];
        }
        tokenData.expiresAt = account.expires_at
          ?? (account.expires_in
            ? Math.floor(Date.now() / 1000) + (account.expires_in as number)
            : undefined);
        delete tokenData.error;
        return token;
      }

      if (tokenData.expiresAt && Date.now() < tokenData.expiresAt * 1000 - 30_000) {
        return token;
      }

      if (!tokenData.refreshToken) {
        tokenData.error = 'RefreshAccessTokenError';
        return token;
      }

      try {
        const refreshed = await refreshKeycloakToken(tokenData.refreshToken);
        tokenData.accessToken = refreshed.access_token;
        if (refreshed.refresh_token) {
          tokenData.refreshToken = refreshed.refresh_token;
        }
        tokenData.expiresAt = Math.floor(Date.now() / 1000) + refreshed.expires_in;
        delete tokenData.error;
      } catch (err) {
        console.error('[auth] Token refresh failed:', err);
        tokenData.error = 'RefreshAccessTokenError';
      }

      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  trustHost: true,
});
