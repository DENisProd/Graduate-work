import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

type TokenWithKeycloakSub = {
  sub?: string;
  keycloakSub?: string;
};

type KeycloakProfileLike = {
  sub?: string;
  id?: string;
};

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
        // Always expose stable Keycloak subject id in the session.
        const kcSub = (token as TokenWithKeycloakSub).keycloakSub;
        session.user.id = kcSub ?? token.sub ?? "";
      }
      return session;
    },
    jwt({ token, account, profile }) {
      // Keep stable Keycloak user id in token for all later requests/session reads.
      if (account?.provider === 'keycloak') {
        const profileData = profile as KeycloakProfileLike | undefined;
        const profileSub = profileData?.sub ?? profileData?.id;
        const providerAccountSub = account.providerAccountId;
        const tokenData = token as TokenWithKeycloakSub;
        const stableSub = profileSub ?? providerAccountSub ?? tokenData.keycloakSub ?? token.sub;

        if (stableSub) {
          tokenData.keycloakSub = stableSub;
          token.sub = stableSub;
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

