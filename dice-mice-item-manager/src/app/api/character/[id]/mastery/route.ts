import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { potionTemplates, spellTemplates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  getCharacterPotionMastery,
  updateCharacterPotionMastery,
  getCharacterSpellMastery,
  updateCharacterSpellMastery,
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
    const currentPotionMastery = await getCharacterPotionMastery(characterId);
    const currentSpellMastery = await getCharacterSpellMastery(characterId);

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

    // Get all discovered spells (for the dropdown when adding new mastery)
    const discoveredSpells = await database
      .select({
        id: spellTemplates.id,
        name: spellTemplates.name,
        baseEffect: spellTemplates.baseEffect,
        school: spellTemplates.school,
        level: spellTemplates.level,
      })
      .from(spellTemplates)
      .where(eq(spellTemplates.isDiscovered, true))
      .orderBy(spellTemplates.name);

    // Enrich mastery data with template info
    const enrichedPotionMastery = await Promise.all(
      currentPotionMastery.map(async (mastery) => {
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

    const enrichedSpellMastery = await Promise.all(
      currentSpellMastery.map(async (mastery) => {
        const spellTemplate = await database
          .select({
            id: spellTemplates.id,
            name: spellTemplates.name,
            baseEffect: spellTemplates.baseEffect,
            school: spellTemplates.school,
            level: spellTemplates.level,
          })
          .from(spellTemplates)
          .where(eq(spellTemplates.id, mastery.spellTemplateId))
          .limit(1);

        return {
          ...mastery,
          spellTemplate: spellTemplate[0] || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      currentPotionMastery: enrichedPotionMastery,
      currentSpellMastery: enrichedSpellMastery,
      discoveredPotions,
      discoveredSpells,
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
    const { potionTemplateId, spellTemplateId, masteryLevel } = body;

    // Validate input - must have either potionTemplateId or spellTemplateId, but not both
    if (
      (!potionTemplateId && !spellTemplateId) ||
      (potionTemplateId && spellTemplateId)
    ) {
      return NextResponse.json(
        {
          error:
            'Must provide either potionTemplateId or spellTemplateId, but not both',
        },
        { status: 400 }
      );
    }

    if (typeof masteryLevel !== 'number') {
      return NextResponse.json(
        {
          error: 'Invalid masteryLevel',
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

    if (potionTemplateId) {
      // Handle potion mastery update
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

      // Update the potion mastery level
      await updateCharacterPotionMastery(
        characterId,
        potionTemplateId,
        masteryLevel
      );
    } else if (spellTemplateId) {
      // Handle spell mastery update
      // Verify the spell template exists and is discovered
      const spellTemplate = await database
        .select()
        .from(spellTemplates)
        .where(
          and(
            eq(spellTemplates.id, spellTemplateId),
            eq(spellTemplates.isDiscovered, true)
          )
        )
        .limit(1);

      if (spellTemplate.length === 0) {
        return NextResponse.json(
          {
            error: 'Spell template not found or not discovered',
          },
          { status: 404 }
        );
      }

      // Update the spell mastery level
      await updateCharacterSpellMastery(
        characterId,
        spellTemplateId,
        masteryLevel
      );
    }

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
