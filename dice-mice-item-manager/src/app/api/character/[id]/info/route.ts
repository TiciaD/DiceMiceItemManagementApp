import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { characters } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: characterId } = await params;
    const body = await request.json();
    const { name, trait } = body;

    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (trait !== null && typeof trait !== 'string') {
      return NextResponse.json(
        { error: 'Trait must be a string or null' },
        { status: 400 }
      );
    }

    const dbInstance = db();

    // Verify character ownership
    const character = await dbInstance
      .select()
      .from(characters)
      .where(
        and(
          eq(characters.id, characterId),
          eq(characters.userId, session.user.id!)
        )
      )
      .limit(1);

    if (!character || character.length === 0) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    // Update character info
    await dbInstance
      .update(characters)
      .set({
        name: name.trim(),
        trait: trait?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(characters.id, characterId));

    return NextResponse.json({
      success: true,
      name: name.trim(),
      trait: trait?.trim() || null,
    });
  } catch (error) {
    console.error('Error updating character info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
