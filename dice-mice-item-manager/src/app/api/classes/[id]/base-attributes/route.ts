import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { classBaseAttributes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');

    if (!level) {
      return NextResponse.json(
        { error: 'Level parameter is required' },
        { status: 400 }
      );
    }

    const database = db();

    // Get base attributes for the specific class and level
    const baseAttributes = await database
      .select()
      .from(classBaseAttributes)
      .where(
        and(
          eq(classBaseAttributes.classId, classId),
          eq(classBaseAttributes.level, parseInt(level))
        )
      )
      .limit(1);

    if (baseAttributes.length === 0) {
      return NextResponse.json(
        { error: 'Base attributes not found for this class and level' },
        { status: 404 }
      );
    }

    return NextResponse.json(baseAttributes[0]);
  } catch (error) {
    console.error('Error fetching class base attributes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch class base attributes' },
      { status: 500 }
    );
  }
}
