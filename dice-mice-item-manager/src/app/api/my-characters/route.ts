import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { characters, counties, classes, houses } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all characters for the user with related data
    const userCharacters = await db()
      .select({
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
      .where(eq(characters.userId, session.user.id))
      .orderBy(characters.createdAt);

    return NextResponse.json({
      success: true,
      characters: userCharacters,
    });
  } catch (error) {
    console.error('Error fetching user characters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}
