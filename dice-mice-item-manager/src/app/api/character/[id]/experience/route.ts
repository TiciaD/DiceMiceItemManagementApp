import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { characters } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getLevelFromExperience } from '@/lib/experience-utils';

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
    const { experience } = body;

    if (typeof experience !== 'number' || experience < 0) {
      return NextResponse.json(
        { error: 'Invalid experience value' },
        { status: 400 }
      );
    }

    const dbInstance = db();

    // Get the character to verify ownership
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
    const newLevel = getLevelFromExperience(experience);
    const leveledUp = newLevel > foundCharacter.currentLevel;

    // Update the character's experience and level
    await dbInstance
      .update(characters)
      .set({
        experience,
        currentLevel: newLevel,
        updatedAt: new Date(),
      })
      .where(eq(characters.id, characterId));

    return NextResponse.json({
      success: true,
      experience,
      currentLevel: newLevel,
      leveledUp,
      previousLevel: foundCharacter.currentLevel,
    });
  } catch (error) {
    console.error('Error updating character experience:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
