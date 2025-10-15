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
    const { currentHP } = body;

    if (typeof currentHP !== 'number' || currentHP < 0) {
      return NextResponse.json({ error: 'Invalid HP value' }, { status: 400 });
    }

    const dbInstance = db();

    // Get the character to verify ownership and max HP
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

    const foundCharacter = character[0];

    // Validate HP is not exceeding max HP
    if (currentHP > foundCharacter.maxHP) {
      return NextResponse.json(
        { error: 'HP cannot exceed maximum HP' },
        { status: 400 }
      );
    }

    // Update the character's current HP
    await dbInstance
      .update(characters)
      .set({
        currentHP,
        updatedAt: new Date(),
      })
      .where(eq(characters.id, characterId));

    return NextResponse.json({
      success: true,
      currentHP,
    });
  } catch (error) {
    console.error('Error updating character HP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
