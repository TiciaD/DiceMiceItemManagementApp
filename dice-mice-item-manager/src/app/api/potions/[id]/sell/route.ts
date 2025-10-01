import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { potions, userPotions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { HouseService } from '@/lib/house-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sellPrice, updateHouseGold } = await request.json();

    // Validate sell price
    if (typeof sellPrice !== 'number' || sellPrice < 0) {
      return NextResponse.json(
        { error: 'Invalid sell price' },
        { status: 400 }
      );
    }

    const database = db();
    const potionId = params.id;

    // First, verify that the user owns this potion
    const userPotion = await database
      .select()
      .from(userPotions)
      .where(
        and(
          eq(userPotions.userId, session.user.id),
          eq(userPotions.potionId, potionId)
        )
      )
      .limit(1);

    if (!userPotion[0]) {
      return NextResponse.json(
        { error: 'Potion not found or not owned by user' },
        { status: 404 }
      );
    }

    // Get the potion details to check if it's consumed
    const potion = await database
      .select()
      .from(potions)
      .where(eq(potions.id, potionId))
      .limit(1);

    if (!potion[0]) {
      return NextResponse.json({ error: 'Potion not found' }, { status: 404 });
    }

    // Check if potion is fully consumed - cannot sell consumed potions
    if (
      potion[0].isFullyConsumed ||
      (potion[0].consumedBy && !potion[0].usedAmount)
    ) {
      return NextResponse.json(
        { error: 'Cannot sell a fully consumed potion' },
        { status: 400 }
      );
    }

    // If updateHouseGold is true, add gold to the user's house
    if (updateHouseGold && sellPrice > 0) {
      const userHouse = await HouseService.getHouseByUserId(session.user.id);
      if (userHouse) {
        await HouseService.addGold(userHouse.id, sellPrice);
      } else {
        return NextResponse.json(
          { error: 'No house found. Create a house to add gold to treasury.' },
          { status: 400 }
        );
      }
    }

    // Remove the potion from user's inventory (delete the ownership record)
    await database
      .delete(userPotions)
      .where(
        and(
          eq(userPotions.userId, session.user.id),
          eq(userPotions.potionId, potionId)
        )
      );

    // Delete the potion itself since it's no longer owned by anyone
    await database.delete(potions).where(eq(potions.id, potionId));

    return NextResponse.json({
      success: true,
      message: `Potion sold for ${sellPrice} gold pieces${
        updateHouseGold ? ' and added to house treasury' : ''
      }`,
      sellPrice,
      updatedHouseGold: updateHouseGold,
    });
  } catch (error) {
    console.error('Error selling potion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
