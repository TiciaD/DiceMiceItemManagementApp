import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { scrolls, userScrolls } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { consumedBy, consumedAt } = await request.json();
    const { id: scrollId } = await params;

    if (!scrollId) {
      return NextResponse.json({ error: 'Invalid scroll ID' }, { status: 400 });
    }

    if (!consumedBy?.trim()) {
      return NextResponse.json(
        { error: 'Consumer name is required' },
        { status: 400 }
      );
    }

    if (!consumedAt) {
      return NextResponse.json(
        { error: 'Consumption date is required' },
        { status: 400 }
      );
    }

    // Check if the scroll exists and belongs to this user
    const existingScroll = await db()
      .select()
      .from(scrolls)
      .innerJoin(userScrolls, eq(scrolls.id, userScrolls.scrollId))
      .where(
        and(eq(scrolls.id, scrollId), eq(userScrolls.userId, session.user.id))
      )
      .limit(1);

    if (existingScroll.length === 0) {
      return NextResponse.json({ error: 'Scroll not found' }, { status: 404 });
    }

    // Check if already consumed
    if (existingScroll[0].scrolls.consumedBy) {
      return NextResponse.json(
        { error: 'Scroll has already been consumed' },
        { status: 400 }
      );
    }

    // Update the scroll to mark as consumed
    const updatedScroll = await db()
      .update(scrolls)
      .set({
        consumedBy: consumedBy.trim(),
        consumedAt: new Date(consumedAt),
      })
      .where(eq(scrolls.id, scrollId))
      .returning();

    return NextResponse.json({
      success: true,
      scroll: updatedScroll[0],
    });
  } catch (error) {
    console.error('Error consuming scroll:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
