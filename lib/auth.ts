import type { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope:
            'openid profile email offline_access ' +
            'Mail.Read User.Read',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Restrict to org emails — add allow-list if needed
      const allowedDomains = ['steampunkfarms.org', 'steampunkstudiolo.org'];
      const email = user.email?.toLowerCase() ?? '';
      const domain = email.split('@')[1];
      if (!allowedDomains.includes(domain)) {
        console.warn(`[Auth] Rejected sign-in from: ${email}`);
        return false;
      }
      return true;
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.role = 'admin'; // Default — extend with DB roles later
      }

      // Refresh expired tokens
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        return token;
      }

      if (token.refreshToken) {
        try {
          const url = `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.AZURE_AD_CLIENT_ID!,
              client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
              grant_type: 'refresh_token',
              refresh_token: token.refreshToken as string,
              scope: 'openid profile email offline_access Mail.Read User.Read',
            }),
          });
          const data = await res.json();
          if (data.access_token) {
            token.accessToken = data.access_token;
            token.refreshToken = data.refresh_token ?? token.refreshToken;
            token.expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in as number);
          }
        } catch (e) {
          console.error('[Auth] Failed to refresh Azure AD token:', e);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role as string;
      }
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
