import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { users } from '@/db/schema';

export async function GET() {
  try {
    // Test database connection
    const result = await db().select().from(users).limit(1);
    console.log('Database test query result:', result);
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.TURSO_DATABASE_URL,
        hasAuthToken: !!process.env.TURSO_AUTH_TOKEN,
        hasDiscordId: !!process.env.DISCORD_CLIENT_ID,
        hasDiscordSecret: !!process.env.DISCORD_CLIENT_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      },
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDbUrl: !!process.env.TURSO_DATABASE_URL,
          hasAuthToken: !!process.env.TURSO_AUTH_TOKEN,
          hasDiscordId: !!process.env.DISCORD_CLIENT_ID,
          hasDiscordSecret: !!process.env.DISCORD_CLIENT_SECRET,
          hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        },
      },
      { status: 500 }
    );
  }
}
