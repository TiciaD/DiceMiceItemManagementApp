import { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db/client';
import { accounts, sessions, users, verificationTokens } from '@/db/schema';
import { createId } from '@paralleldrive/cuid2';

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
    createUser: async (user: any) => {
      const userId = createId();
      const result = await db()
        .insert(users)
        .values({
          ...user,
          id: userId,
        })
        .returning();
      return result[0];
    },
  };
}

export const authOptions: NextAuthOptions = {
  adapter: customDrizzleAdapter(),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: ({ session, user }: any) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
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
      console.log('NextAuth Debug:', code, metadata);
    },
  },
};
