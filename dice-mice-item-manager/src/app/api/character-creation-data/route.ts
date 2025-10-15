import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { counties, classes, houses } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has a house (required for character creation)
    const userHouse = await db()
      .select({
        id: houses.id,
        name: houses.name,
      })
      .from(houses)
      .where(eq(houses.userId, session.user.id))
      .limit(1);

    if (userHouse.length === 0) {
      return NextResponse.json(
        {
          error: 'You must create a house before creating a character',
        },
        { status: 400 }
      );
    }

    // Fetch all counties
    const allCounties = await db()
      .select({
        id: counties.id,
        name: counties.name,
        description: counties.description,
        associatedStat: counties.associatedStat,
        associatedSkills: counties.associatedSkills,
      })
      .from(counties)
      .orderBy(counties.name);

    // Fetch all available classes
    const allClasses = await db()
      .select({
        id: classes.id,
        name: classes.name,
        description: classes.description,
        prerequisiteStat1: classes.prerequisiteStat1,
        prerequisiteStat2: classes.prerequisiteStat2,
        isAvailable: classes.isAvailable,
        willpowerProgression: classes.willpowerProgression,
        hitDie: classes.hitDie,
      })
      .from(classes)
      .where(eq(classes.isAvailable, true))
      .orderBy(classes.name);

    return NextResponse.json({
      success: true,
      data: {
        counties: allCounties,
        classes: allClasses,
        userHouse: userHouse[0],
      },
    });
  } catch (error) {
    console.error('Error fetching character creation data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch character creation data' },
      { status: 500 }
    );
  }
}
