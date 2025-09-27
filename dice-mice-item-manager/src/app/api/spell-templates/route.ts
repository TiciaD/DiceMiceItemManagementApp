import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { spellTemplates } from '@/db/schema';

export async function GET() {
  try {
    const database = db();
    const templates = await database.select().from(spellTemplates);
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching spell templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spell templates' },
      { status: 500 }
    );
  }
}
