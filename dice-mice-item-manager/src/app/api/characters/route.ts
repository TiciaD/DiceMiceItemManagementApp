import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { characters, houses } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Fetch all characters with their house information for the autocomplete
    // This is used in forms where users need to select any character as a crafter
    const allCharacters = await db()
      .select({
        id: characters.id,
        name: characters.name,
        currentLevel: characters.currentLevel,
        house: {
          id: houses.id,
          name: houses.name,
        },
      })
      .from(characters)
      .leftJoin(houses, eq(characters.houseId, houses.id))
      .orderBy(characters.name);

    return NextResponse.json({
      success: true,
      characters: allCharacters,
    });
  } catch (error) {
    console.error('Error fetching characters for autocomplete:', error);
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}
