import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import {
  classes,
  skills,
  classSkills,
  classAbilities,
  classBaseAttributes,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { ClassWithDetails, ClassBaseAttribute } from '@/types/classes';

export async function GET() {
  try {
    const database = db();

    // Fetch all classes
    const allClasses = await database
      .select()
      .from(classes)
      .where(eq(classes.isAvailable, true));

    // Fetch all related data for each class
    const classesWithDetails: ClassWithDetails[] = [];

    for (const classItem of allClasses) {
      // Fetch skills for this class
      const classSkillsData = await database
        .select({
          skill: skills,
        })
        .from(classSkills)
        .innerJoin(skills, eq(classSkills.skillId, skills.id))
        .where(eq(classSkills.classId, classItem.id));

      // Fetch abilities for this class
      const abilitiesData = await database
        .select()
        .from(classAbilities)
        .where(eq(classAbilities.classId, classItem.id))
        .orderBy(classAbilities.level);

      // Fetch base attributes for this class
      const baseAttributesData = await database
        .select()
        .from(classBaseAttributes)
        .where(eq(classBaseAttributes.classId, classItem.id))
        .orderBy(classBaseAttributes.level);

      // Check if this class has optional columns at level 1
      const level1Attributes = baseAttributesData.find(
        (attr: ClassBaseAttribute) => attr.level === 1
      );
      const hasSlayer = level1Attributes?.slayer !== null;
      const hasRage = level1Attributes?.rage !== null;
      const hasBrutalAdvantage = level1Attributes?.brutalAdvantage !== null;

      classesWithDetails.push({
        ...classItem,
        skills: classSkillsData.map((cs: any) => cs.skill),
        abilities: abilitiesData,
        baseAttributes: baseAttributesData,
        hasSlayer,
        hasRage,
        hasBrutalAdvantage,
      });
    }

    return NextResponse.json(classesWithDetails);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}
