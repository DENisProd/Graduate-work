import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Keycloak({
      authorization: {
        params: { prompt: 'login' },
      },
    }),
  ],
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
        // Prefer stable Keycloak subject from the profile (if captured in jwt callback).
        const kcSub = (token as unknown as { keycloakSub?: string }).keycloakSub;
        session.user.id = kcSub ?? token.sub ?? "";
      }
      return session;
    },
    jwt({ token, account, profile }) {
      // NextAuth's token.sub can vary depending on configuration. Keycloak's OIDC `sub`
      // is the stable external user id we rely on across services.
      if (account?.provider === 'keycloak') {
        const p = profile as unknown as { sub?: string } | undefined;
        if (p?.sub) {
          (token as unknown as { keycloakSub?: string }).keycloakSub = p.sub;
          token.sub = p.sub;
        }
      }
      return token;
    },
  },
  pages: {
    signIn: "/api/auth/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  trustHost: true,
});

