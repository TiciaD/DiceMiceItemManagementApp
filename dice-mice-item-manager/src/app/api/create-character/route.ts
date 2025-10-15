import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { characters, counties, classes, houses } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface CreateCharacterRequest {
  name: string;
  trait?: string;
  countyId: string;
  classId: string;
  currentHP: number;
  maxHP: number;
  currentSTR: number;
  currentCON: number;
  currentDEX: number;
  currentINT: number;
  currentWIS: number;
  currentCHA: number;
  experience?: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateCharacterRequest = await request.json();

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Character name is required' },
        { status: 400 }
      );
    }

    if (!body.countyId || !body.classId) {
      return NextResponse.json(
        { error: 'County and class are required' },
        { status: 400 }
      );
    }

    // Validate stats (assuming they should be between 3-18 for D&D-like system)
    const stats = [
      body.currentSTR,
      body.currentCON,
      body.currentDEX,
      body.currentINT,
      body.currentWIS,
      body.currentCHA,
    ];
    if (stats.some((stat) => stat < 3 || stat > 18)) {
      return NextResponse.json(
        { error: 'Stats must be between 3 and 18' },
        { status: 400 }
      );
    }

    // Validate HP (should be positive)
    if (body.currentHP < 0 || body.maxHP < 1) {
      return NextResponse.json({ error: 'Invalid HP values' }, { status: 400 });
    }

    // Check if user has a house
    const userHouse = await db()
      .select({ id: houses.id })
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

    // Verify county exists
    const county = await db()
      .select({ id: counties.id })
      .from(counties)
      .where(eq(counties.id, body.countyId))
      .limit(1);

    if (county.length === 0) {
      return NextResponse.json(
        { error: 'Invalid county selected' },
        { status: 400 }
      );
    }

    // Verify class exists and check prerequisites
    const selectedClass = await db()
      .select({
        id: classes.id,
        prerequisiteStat1: classes.prerequisiteStat1,
        prerequisiteStat2: classes.prerequisiteStat2,
        isAvailable: classes.isAvailable,
      })
      .from(classes)
      .where(and(eq(classes.id, body.classId), eq(classes.isAvailable, true)))
      .limit(1);

    if (selectedClass.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or unavailable class selected' },
        { status: 400 }
      );
    }

    // Check class prerequisites
    const classData = selectedClass[0];
    const getStatValue = (statName: string): number => {
      switch (statName.toUpperCase()) {
        case 'STR':
          return body.currentSTR;
        case 'CON':
          return body.currentCON;
        case 'DEX':
          return body.currentDEX;
        case 'INT':
          return body.currentINT;
        case 'WIS':
          return body.currentWIS;
        case 'CHA':
          return body.currentCHA;
        default:
          return 0;
      }
    };

    // Check primary prerequisite (usually needs to be 13+)
    const primaryStat = getStatValue(classData.prerequisiteStat1);
    if (primaryStat < 13) {
      return NextResponse.json(
        {
          error: `${classData.prerequisiteStat1} must be at least 13 for this class`,
        },
        { status: 400 }
      );
    }

    // Check secondary prerequisite if it exists
    if (classData.prerequisiteStat2) {
      const secondaryStat = getStatValue(classData.prerequisiteStat2);
      if (secondaryStat < 13) {
        return NextResponse.json(
          {
            error: `${classData.prerequisiteStat2} must be at least 13 for this class`,
          },
          { status: 400 }
        );
      }
    }

    // Create the character
    const newCharacter = await db()
      .insert(characters)
      .values({
        name: body.name.trim(),
        userId: session.user.id,
        houseId: userHouse[0].id,
        countyId: body.countyId,
        classId: body.classId,
        currentLevel: 1,
        currentHP: body.currentHP,
        maxHP: body.maxHP,
        currentStatus: 'ALIVE',
        currentSTR: body.currentSTR,
        currentCON: body.currentCON,
        currentDEX: body.currentDEX,
        currentINT: body.currentINT,
        currentWIS: body.currentWIS,
        currentCHA: body.currentCHA,
        // Initialize progression tracking
        hpRollsByLevel: JSON.stringify({ '1': body.maxHP }),
        statsByLevel: JSON.stringify({
          '1': {
            STR: body.currentSTR,
            CON: body.currentCON,
            DEX: body.currentDEX,
            INT: body.currentINT,
            WIS: body.currentWIS,
            CHA: body.currentCHA,
          },
        }),
        trait: body.trait?.trim() || null,
        notes: null,
        experience: body.experience || 0,
      })
      .returning({ id: characters.id });

    return NextResponse.json({
      success: true,
      characterId: newCharacter[0].id,
      message: 'Character created successfully',
    });
  } catch (error) {
    console.error('Error creating character:', error);
    return NextResponse.json(
      { error: 'Failed to create character' },
      { status: 500 }
    );
  }
}
