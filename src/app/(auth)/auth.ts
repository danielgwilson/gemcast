import { DUMMY_PASSWORD } from '@/lib/constants';
import { createUser, getUser } from '@/lib/db/queries';
import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { authConfig } from './auth.config';

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('Missing GOOGLE_CLIENT_ID in .env.local');
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing GOOGLE_CLIENT_SECRET in .env.local');
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Missing NEXTAUTH_SECRET in .env.local');
}

export type UserType = 'regular';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession['user'];
  }

  // biome-ignore lint/nursery/useConsistentTypeDefinitions: "Required"
  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);

        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) {
          return null;
        }

        return { ...user, type: 'regular' };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope:
            'openid email profile https://www.googleapis.com/auth/meetings.space.created https://www.googleapis.com/auth/drive.meet.readonly https://www.googleapis.com/auth/calendar.app.created',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign in - create user in database if doesn't exist
      if (account?.provider === 'google' && user.email) {
        const existingUsers = await getUser(user.email);
        
        if (existingUsers.length === 0) {
          // Create user - OAuth users don't need passwords, but schema requires it
          // Generate a random password hash (they'll never use it)
          const { generateHashedPassword } = await import('@/lib/db/utils');
          const { generateUUID } = await import('@/lib/utils');
          const randomPassword = generateUUID();
          await createUser(user.email, randomPassword);
        }
      }
      
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // For Google OAuth, user.id might not be set, so fetch from database
        if (account?.provider === 'google' && user.email && !user.id) {
          const users = await getUser(user.email);
          if (users.length > 0) {
            token.id = users[0].id;
            token.type = 'regular';
          }
        } else {
          token.id = user.id as string;
          token.type = user.type || 'regular';
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type || 'regular';
      }

      return session;
    },
  },
});
