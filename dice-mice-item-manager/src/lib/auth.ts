import { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db/client';
import { accounts, sessions, users, verificationTokens } from '@/db/schema';
import { createId } from '@paralleldrive/cuid2';
import type { AdapterUser } from 'next-auth/adapters';

// Extend AdapterUser to include our custom role field
interface ExtendedAdapterUser extends Omit<AdapterUser, 'role'> {
  role: 'BASIC' | 'DM';
}

// Custom adapter that ensures ID generation
function customDrizzleAdapter() {
  const baseAdapter = DrizzleAdapter(db(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  });

  return {
    ...baseAdapter,
    createUser: async (user: Omit<ExtendedAdapterUser, 'id'>) => {
      const userId = createId();
      const result = await db()
        .insert(users)
        .values({
          ...user,
          id: userId,
          role: 'BASIC', // Explicitly set default role for new users
        })
        .returning();
      return result[0];
    },
  };
}

export const authOptions: NextAuthOptions = {
  // Only use adapter if database is available
  adapter: process.env.TURSO_DATABASE_URL ? (customDrizzleAdapter() as any) : undefined,
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: ({ session, user }: { session: any; user: any }) => ({
      ...session,
      user: {
        ...session.user,
        id: user?.id,
      },
    }),
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata);
    },
    warn(code) {
      console.warn('NextAuth Warning:', code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('NextAuth Debug:', code, metadata);
      }
    },
  },
  // Add better error pages
  pages: {
    error: '/auth/error', // We'll create this page
  },
};
