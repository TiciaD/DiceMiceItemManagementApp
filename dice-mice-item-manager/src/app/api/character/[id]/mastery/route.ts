import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { potionTemplates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  getCharacterPotionMastery,
  updateCharacterPotionMastery,
} from '@/lib/mastery-utils';

// GET - Fetch character's potion mastery and available discovered potions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: characterId } = await params;
    const database = db();

    // Get character's current mastery levels
    const currentMastery = await getCharacterPotionMastery(characterId);

    // Get all discovered potions (for the dropdown when adding new mastery)
    const discoveredPotions = await database
      .select({
        id: potionTemplates.id,
        name: potionTemplates.name,
        description: potionTemplates.description,
      })
      .from(potionTemplates)
      .where(eq(potionTemplates.isDiscovered, true))
      .orderBy(potionTemplates.name);

    // Enrich mastery data with potion template info
    const enrichedMastery = await Promise.all(
      currentMastery.map(async (mastery) => {
        const potionTemplate = await database
          .select({
            id: potionTemplates.id,
            name: potionTemplates.name,
            description: potionTemplates.description,
          })
          .from(potionTemplates)
          .where(eq(potionTemplates.id, mastery.potionTemplateId))
          .limit(1);

        return {
          ...mastery,
          potionTemplate: potionTemplate[0] || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      currentMastery: enrichedMastery,
      discoveredPotions,
    });
  } catch (error) {
    console.error('Error fetching character mastery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch character mastery' },
      { status: 500 }
    );
  }
}

// PATCH - Update character's mastery for a specific potion
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
    const { potionTemplateId, masteryLevel } = body;

    // Validate input
    if (!potionTemplateId || typeof masteryLevel !== 'number') {
      return NextResponse.json(
        {
          error: 'Missing or invalid potionTemplateId or masteryLevel',
        },
        { status: 400 }
      );
    }

    // Validate mastery level is within bounds
    if (masteryLevel < 0 || masteryLevel > 10) {
      return NextResponse.json(
        {
          error: 'Mastery level must be between 0 and 10',
        },
        { status: 400 }
      );
    }

    const database = db();

    // Verify the potion template exists and is discovered
    const potionTemplate = await database
      .select()
      .from(potionTemplates)
      .where(
        and(
          eq(potionTemplates.id, potionTemplateId),
          eq(potionTemplates.isDiscovered, true)
        )
      )
      .limit(1);

    if (potionTemplate.length === 0) {
      return NextResponse.json(
        {
          error: 'Potion template not found or not discovered',
        },
        { status: 404 }
      );
    }

    // Update the mastery level
    await updateCharacterPotionMastery(
      characterId,
      potionTemplateId,
      masteryLevel
    );

    return NextResponse.json({
      success: true,
      message: 'Mastery level updated successfully',
    });
  } catch (error) {
    console.error('Error updating character mastery:', error);
    return NextResponse.json(
      { error: 'Failed to update character mastery' },
      { status: 500 }
    );
  }
}
