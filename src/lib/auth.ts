import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google'; // <-- 1. Import the Google provider
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    // 2. Drop the Google provider here linked to your .env keys
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await getUserByEmail(credentials.email);
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role } as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // No database adapter is configured (session strategy is 'jwt'), so
      // NextAuth never persists OAuth sign-ins on its own - without this,
      // a Google user would only ever exist as a token, with no row in
      // `users`, which silently breaks anything keyed on userId (wishlist,
      // account settings). Give them a real row the first time they sign in.
      if (account?.provider === 'google' && user.email) {
        const existing = await getUserByEmail(user.email);
        if (!existing) {
          // Empty-string password is a deliberate, permanent sentinel for
          // "this account has no password" - bcrypt.compare never matches
          // an empty hash, so credentials sign-in correctly stays rejected
          // for accounts that only exist through Google.
          await createUser({
            name: user.name || user.email.split('@')[0],
            email: user.email,
            password: '',
            role: 'CUSTOMER',
          });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      // `user` is only present on the initial sign-in call, not on later
      // token refreshes. Resolve the real DB id by email every time it's
      // present, rather than trusting whatever id the provider handed
      // back - Google's `user.id` is its own sub, not our row's id.
      if (user?.email) {
        const dbUser = await getUserByEmail(user.email);
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      // Account settings calls session.update({ name }) after a successful
      // save so the header/dropdown reflect the new name immediately,
      // without forcing the person to sign out and back in.
      if (trigger === 'update' && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};