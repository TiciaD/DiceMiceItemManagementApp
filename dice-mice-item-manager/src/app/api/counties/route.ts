import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { counties } from '@/db/schema';

export async function GET() {
  try {
    const allCounties = await db().select().from(counties);

    return NextResponse.json({ counties: allCounties }, { status: 200 });
  } catch (error) {
    console.error('Error fetching counties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch counties' },
      { status: 500 }
    );
  }
}
