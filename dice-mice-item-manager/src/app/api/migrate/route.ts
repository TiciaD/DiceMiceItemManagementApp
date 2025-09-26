import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { migrate } from 'drizzle-orm/libsql/migrator';

// This endpoint should be protected in production!
// Add authentication/authorization as needed
export async function POST(request: NextRequest) {
  try {
    // Verify this is being called from a secure context
    const authHeader = request.headers.get('authorization');
    if (
      !authHeader ||
      authHeader !== `Bearer ${process.env.MIGRATION_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting database migration...');

    // Create database client
    const turso = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    const db = drizzle(turso);

    // Run migrations
    await migrate(db, { migrationsFolder: './src/db/migrations' });

    console.log('Migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Migration failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET method to check migration status
export async function GET() {
  return NextResponse.json({
    message:
      'Migration endpoint is available. Use POST with proper authorization to run migrations.',
    timestamp: new Date().toISOString(),
  });
}
