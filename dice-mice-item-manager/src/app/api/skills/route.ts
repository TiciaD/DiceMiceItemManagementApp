import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { skills, skillAbilities } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { SkillWithDetails } from '@/types/skills';

export async function GET() {
  try {
    const database = db();

    // Fetch all skills
    const allSkills = await database.select().from(skills);

    // Fetch all related data for each skill
    const skillsWithDetails: SkillWithDetails[] = [];

    for (const skill of allSkills) {
      // Fetch abilities for this skill
      const abilitiesData = await database
        .select()
        .from(skillAbilities)
        .where(eq(skillAbilities.skillId, skill.id))
        .orderBy(skillAbilities.level);

      skillsWithDetails.push({
        ...skill,
        abilities: abilitiesData,
      });
    }

    return NextResponse.json(skillsWithDetails);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}
