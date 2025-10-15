import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { characters, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { newLevel, newXP, attributeChanges, hpGain, advancedMode } =
      await request.json();

    // Validate input
    if (
      !newLevel ||
      !newXP ||
      !attributeChanges ||
      typeof hpGain !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate attribute changes (relaxed in advanced mode)
    const totalPoints = Object.values(
      attributeChanges as Record<string, number>
    ).reduce((sum: number, val: number) => sum + val, 0);
    const attributesChanged = Object.values(
      attributeChanges as Record<string, number>
    ).filter((val: number) => val > 0).length;

    if (!advancedMode) {
      // Normal mode: strict validation
      if (totalPoints !== 2 || attributesChanged > 2) {
        return NextResponse.json(
          { error: 'Invalid attribute point allocation' },
          { status: 400 }
        );
      }
    } else {
      // Advanced mode: more flexible validation
      if (totalPoints > 20 || totalPoints < -10) {
        // Reasonable bounds
        return NextResponse.json(
          { error: 'Attribute point allocation out of reasonable bounds' },
          { status: 400 }
        );
      }
    }

    // Get current character to verify ownership and current state
    const [currentCharacter] = await db()
      .select({
        character: characters,
        user: users,
      })
      .from(characters)
      .innerJoin(users, eq(characters.userId, users.id))
      .where(
        and(eq(characters.id, id), eq(users.email, session.user?.email ?? ''))
      );

    if (!currentCharacter) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    // Verify the level up is valid (should be exactly current level + 1)
    if (newLevel !== currentCharacter.character.currentLevel + 1) {
      return NextResponse.json(
        { error: 'Invalid level progression' },
        { status: 400 }
      );
    }

    // Calculate new attribute values
    const newSTR =
      currentCharacter.character.currentSTR + (attributeChanges.STR || 0);
    const newCON =
      currentCharacter.character.currentCON + (attributeChanges.CON || 0);
    const newDEX =
      currentCharacter.character.currentDEX + (attributeChanges.DEX || 0);
    const newINT =
      currentCharacter.character.currentINT + (attributeChanges.INT || 0);
    const newWIS =
      currentCharacter.character.currentWIS + (attributeChanges.WIS || 0);
    const newCHA =
      currentCharacter.character.currentCHA + (attributeChanges.CHA || 0);

    // Validate attribute caps based on level (relaxed in advanced mode)
    const getAttributeCap = (level: number): number => {
      if (level >= 12) return 24;
      if (level >= 8) return 22;
      if (level >= 4) return 20;
      return 18;
    };

    const cap = advancedMode ? 30 : getAttributeCap(newLevel); // Higher cap in advanced mode
    const newAttributes = [newSTR, newCON, newDEX, newINT, newWIS, newCHA];

    if (newAttributes.some((attr) => attr > cap || attr < 1)) {
      return NextResponse.json(
        {
          error: `Attributes must be between 1 and ${cap}${
            advancedMode ? ' (Advanced Mode)' : ` for level ${newLevel}`
          }`,
        },
        { status: 400 }
      );
    }

    // Calculate new max HP
    const newMaxHP = currentCharacter.character.maxHP + hpGain;

    // Update the character
    await db()
      .update(characters)
      .set({
        currentLevel: newLevel,
        experience: newXP,
        currentSTR: newSTR,
        currentCON: newCON,
        currentDEX: newDEX,
        currentINT: newINT,
        currentWIS: newWIS,
        currentCHA: newCHA,
        maxHP: newMaxHP,
        // Also heal to full HP on level up (common in many systems)
        currentHP: newMaxHP,
        updatedAt: new Date(),
      })
      .where(eq(characters.id, id));

    return NextResponse.json({
      success: true,
      character: {
        currentLevel: newLevel,
        experience: newXP,
        currentSTR: newSTR,
        currentCON: newCON,
        currentDEX: newDEX,
        currentINT: newINT,
        currentWIS: newWIS,
        currentCHA: newCHA,
        maxHP: newMaxHP,
        currentHP: newMaxHP,
      },
    });
  } catch (error) {
    console.error('Error in level-up API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
