import NextAuth, { type NextAuthConfig } from 'next-auth';
import Facebook from 'next-auth/providers/facebook';
import Google from 'next-auth/providers/google';

/**
 * Auth.js (NextAuth v5) configuration for AUTO ANI.
 *
 * - JWT session strategy: sessions live in an encrypted cookie, so NO database
 *   is required. (Persisting accounts/history is a future phase that would add
 *   a database adapter here.)
 * - Providers are registered only when their credentials are present, so the
 *   app runs fine with just Google configured (Facebook needs app review).
 *
 * Reads existing env names: GOOGLE_CLIENT_ID/SECRET, FACEBOOK_APP_ID/SECRET.
 * Secret resolves from AUTH_SECRET or NEXTAUTH_SECRET.
 */

const providers: NextAuthConfig['providers'] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  providers.push(
    Facebook({
      clientId: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  // Needed when running behind a custom domain / non-Vercel host (e.g. Render).
  trustHost: true,
});
