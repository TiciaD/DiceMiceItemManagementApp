import { NextResponse } from 'next/server';

export async function GET() {
  const requiredVars = [
    'TURSO_DATABASE_URL',
    'TURSO_AUTH_TOKEN',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
  ];

  const envStatus = requiredVars.reduce((acc, varName) => {
    acc[varName] = {
      exists: !!process.env[varName],
      length: process.env[varName]?.length || 0,
      // Only show first/last 4 characters for security
      preview: process.env[varName]
        ? `${process.env[varName]?.slice(0, 4)}...${process.env[varName]?.slice(
            -4
          )}`
        : 'NOT_SET',
    };
    return acc;
  }, {} as Record<string, any>);

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
    environment: envStatus,
    timestamp: new Date().toISOString(),
  });
}
