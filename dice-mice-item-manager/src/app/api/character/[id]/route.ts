import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import {
  characters,
  counties,
  classes,
  houses,
  classBaseAttributes,
  classAbilities,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: characterId } = await params;

    // Fetch character with all related data
    const characterData = await db()
      .select({
        // Character data
        id: characters.id,
        name: characters.name,
        currentLevel: characters.currentLevel,
        currentHP: characters.currentHP,
        maxHP: characters.maxHP,
        currentStatus: characters.currentStatus,
        currentSTR: characters.currentSTR,
        currentCON: characters.currentCON,
        currentDEX: characters.currentDEX,
        currentINT: characters.currentINT,
        currentWIS: characters.currentWIS,
        currentCHA: characters.currentCHA,
        trait: characters.trait,
        notes: characters.notes,
        experience: characters.experience,
        createdAt: characters.createdAt,
        updatedAt: characters.updatedAt,
        // House data
        house: {
          id: houses.id,
          name: houses.name,
          motto: houses.motto,
          bio: houses.bio,
          gold: houses.gold,
        },
        // County data
        county: {
          id: counties.id,
          name: counties.name,
          description: counties.description,
          associatedStat: counties.associatedStat,
          associatedSkills: counties.associatedSkills,
        },
        // Class data
        class: {
          id: classes.id,
          name: classes.name,
          description: classes.description,
          prerequisiteStat1: classes.prerequisiteStat1,
          prerequisiteStat2: classes.prerequisiteStat2,
          isAvailable: classes.isAvailable,
          willpowerProgression: classes.willpowerProgression,
          hitDie: classes.hitDie,
        },
      })
      .from(characters)
      .leftJoin(houses, eq(characters.houseId, houses.id))
      .leftJoin(counties, eq(characters.countyId, counties.id))
      .leftJoin(classes, eq(characters.classId, classes.id))
      .where(
        and(
          eq(characters.id, characterId),
          eq(characters.userId, session.user.id)
        )
      )
      .limit(1);

    if (characterData.length === 0) {
      return NextResponse.json(
        {
          error: 'Character not found or you do not have permission to view it',
        },
        { status: 404 }
      );
    }

    const character = characterData[0];

    // Verify character has class data
    if (!character.class) {
      return NextResponse.json(
        {
          error: 'Character class data not found',
        },
        { status: 404 }
      );
    }

    // Fetch class base attributes for the character's current level
    const classBaseAttrs = await db()
      .select({
        level: classBaseAttributes.level,
        attack: classBaseAttributes.attack,
        spellAttack: classBaseAttributes.spellAttack,
        ac: classBaseAttributes.ac,
        fortitude: classBaseAttributes.fortitude,
        reflex: classBaseAttributes.reflex,
        will: classBaseAttributes.will,
        damageBonus: classBaseAttributes.damageBonus,
        leadership: classBaseAttributes.leadership,
        skillRanks: classBaseAttributes.skillRanks,
        slayer: classBaseAttributes.slayer,
        rage: classBaseAttributes.rage,
        brutalAdvantage: classBaseAttributes.brutalAdvantage,
      })
      .from(classBaseAttributes)
      .where(
        and(
          eq(classBaseAttributes.classId, character.class.id),
          eq(classBaseAttributes.level, character.currentLevel)
        )
      )
      .limit(1);

    if (classBaseAttrs.length === 0) {
      return NextResponse.json(
        {
          error: `No class attributes found for ${character.class.name} at level ${character.currentLevel}`,
        },
        { status: 404 }
      );
    }

    // Fetch all class abilities for the character's class
    const allClassAbilities = await db()
      .select({
        id: classAbilities.id,
        name: classAbilities.name,
        description: classAbilities.description,
        level: classAbilities.level,
      })
      .from(classAbilities)
      .where(eq(classAbilities.classId, character.class.id))
      .orderBy(classAbilities.level, classAbilities.name);

    // Separate available and future abilities
    const availableAbilities = allClassAbilities.filter(
      (ability) => ability.level <= character.currentLevel
    );
    const futureAbilities = allClassAbilities.filter(
      (ability) => ability.level > character.currentLevel
    );

    return NextResponse.json({
      success: true,
      character: character,
      classBaseAttributes: classBaseAttrs[0],
      classAbilities: {
        available: availableAbilities,
        future: futureAbilities,
      },
    });
  } catch (error) {
    console.error('Error fetching character details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch character details' },
      { status: 500 }
    );
  }
}
