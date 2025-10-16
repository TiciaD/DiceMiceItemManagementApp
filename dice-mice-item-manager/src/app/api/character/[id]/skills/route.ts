import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import {
  characters,
  characterSkills,
  skills,
  skillAbilities,
  classSkills,
  classBaseAttributes,
  houses,
  classes,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import type {
  CharacterSkillsData,
  CharacterSkillWithDetails,
} from '@/types/character-skills';
import {
  getSkillRank,
  calculateSkillBonus,
  calculateTotalSkillBonus,
  calculateSkillPoints,
  getAvailableSkillAbilities,
  calculateClassCompetencyPoints,
} from '@/lib/skill-utils';

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
    const database = db();

    // Get character details with house and class info
    const character = await database
      .select({
        character: characters,
        house: houses,
        class: classes,
      })
      .from(characters)
      .innerJoin(houses, eq(characters.houseId, houses.id))
      .innerJoin(classes, eq(characters.classId, classes.id))
      .where(eq(characters.id, characterId))
      .limit(1);

    if (character.length === 0) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    const characterData = character[0].character;
    const houseData = character[0].house;
    const classData = character[0].class;

    // Verify ownership
    if (characterData.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all skills
    const allSkills = await database.select().from(skills);

    // Get character's skill investments
    const characterSkillInvestments = await database
      .select()
      .from(characterSkills)
      .where(eq(characterSkills.characterId, characterId));

    // Get class skills for this character's class
    const classSkillData = await database
      .select()
      .from(classSkills)
      .where(eq(classSkills.classId, characterData.classId));

    const classSkillIds = classSkillData.map((cs) => cs.skillId);

    // Get skill ranks for the character's current level
    const currentLevelAttributes = await database
      .select()
      .from(classBaseAttributes)
      .where(
        and(
          eq(classBaseAttributes.classId, characterData.classId),
          eq(classBaseAttributes.level, characterData.currentLevel)
        )
      )
      .limit(1);

    if (currentLevelAttributes.length === 0) {
      return NextResponse.json(
        { error: 'Class attributes not found for current level' },
        { status: 404 }
      );
    }

    const skillRanksAtCurrentLevel = currentLevelAttributes[0].skillRanks;

    // Calculate skill points
    const totalPointsSpent = characterSkillInvestments.reduce(
      (sum, investment) => sum + investment.pointsInvested,
      0
    );
    const skillPoints = calculateSkillPoints(
      skillRanksAtCurrentLevel,
      totalPointsSpent
    );

    // Build skills with details
    const skillsWithDetails: CharacterSkillWithDetails[] = [];
    const isBard = classData.name.toLowerCase() === 'bard';

    for (const skill of allSkills) {
      const investment = characterSkillInvestments.find(
        (inv) => inv.skillId === skill.id
      );
      const pointsInvested = investment?.pointsInvested || 0;
      const isClassSkill = classSkillIds.includes(skill.id);

      // Apply class competency - different logic for Bards vs other classes
      const classCompetencyPoints = calculateClassCompetencyPoints(
        isClassSkill,
        characterData.currentLevel,
        houseData.classCompetencyLevel,
        isBard
      );

      const totalPointsForCalculation = pointsInvested + classCompetencyPoints;

      // Get skill abilities
      const abilities = await database
        .select()
        .from(skillAbilities)
        .where(eq(skillAbilities.skillId, skill.id))
        .orderBy(skillAbilities.level);

      const abilitiesWithAvailability = getAvailableSkillAbilities(
        totalPointsForCalculation,
        abilities
      );

      // Get associated stat value
      const statValue = getStatValue(characterData, skill.associatedStat);

      skillsWithDetails.push({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        associatedStat: skill.associatedStat,
        pointsInvested,
        classCompetencyPoints, // Add this field to track free points
        isClassSkill,
        skillRank: getSkillRank(totalPointsForCalculation),
        skillBonus: calculateSkillBonus(totalPointsForCalculation),
        totalBonus: calculateTotalSkillBonus(
          totalPointsForCalculation,
          statValue
        ),
        abilities: abilitiesWithAvailability,
      });
    }

    const response: CharacterSkillsData = {
      skills: skillsWithDetails,
      skillPoints,
      characterLevel: characterData.currentLevel,
      classSkillIds,
      classCompetencyLevel: houseData.classCompetencyLevel,
      className: classData.name,
      isBard,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching character skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch character skills' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: characterId } = await params;
    const body = await request.json();
    const { skillAllocations } = body; // Array of { skillId: string, points: number }

    if (!Array.isArray(skillAllocations)) {
      return NextResponse.json(
        { error: 'Invalid skill allocations' },
        { status: 400 }
      );
    }

    const database = db();

    // Get character details (we don't need house info for PATCH, just verification)
    const character = await database
      .select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (character.length === 0) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    const characterData = character[0];

    // Verify ownership
    if (characterData.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update skill allocations
    for (const allocation of skillAllocations) {
      if (allocation.points > 0) {
        // Check if record exists
        const existing = await database
          .select()
          .from(characterSkills)
          .where(
            and(
              eq(characterSkills.characterId, characterId),
              eq(characterSkills.skillId, allocation.skillId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Update existing record
          await database
            .update(characterSkills)
            .set({
              pointsInvested: allocation.points,
            })
            .where(
              and(
                eq(characterSkills.characterId, characterId),
                eq(characterSkills.skillId, allocation.skillId)
              )
            );
        } else {
          // Insert new record
          await database.insert(characterSkills).values({
            characterId,
            skillId: allocation.skillId,
            pointsInvested: allocation.points,
          });
        }
      } else {
        // Remove skill allocation if points = 0
        await database
          .delete(characterSkills)
          .where(
            and(
              eq(characterSkills.characterId, characterId),
              eq(characterSkills.skillId, allocation.skillId)
            )
          );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating character skills:', error);
    return NextResponse.json(
      { error: 'Failed to update character skills' },
      { status: 500 }
    );
  }
}

function getStatValue(character: any, statName: string): number {
  switch (statName.toUpperCase()) {
    case 'STR':
      return character.currentSTR;
    case 'CON':
      return character.currentCON;
    case 'DEX':
      return character.currentDEX;
    case 'INT':
      return character.currentINT;
    case 'WIS':
      return character.currentWIS;
    case 'CHA':
      return character.currentCHA;
    default:
      return 10; // Default ability score
  }
}
