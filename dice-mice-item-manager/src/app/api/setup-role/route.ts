import { NextResponse } from 'next/server';
import { db } from '@/db/client';

export async function POST() {
  try {
    // This is a one-time setup endpoint to add the role column
    const database = db();

    // Try to add the role column if it doesn't exist
    await database.run(`
      ALTER TABLE user ADD COLUMN role TEXT DEFAULT 'BASIC' NOT NULL;
    `);

    return NextResponse.json({
      success: true,
      message: 'Role column added successfully',
    });
  } catch (error: any) {
    // If the column already exists, that's fine
    if (
      error.message?.includes('duplicate column name') ||
      error.message?.includes('already exists')
    ) {
      return NextResponse.json({
        success: true,
        message: 'Role column already exists',
      });
    }

    console.error('Error adding role column:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add role column' },
      { status: 500 }
    );
  }
}
