import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { scrolls, userScrolls } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { HouseService } from '@/lib/house-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sellPrice, updateHouseGold } = await request.json();
    const { id: scrollId } = await params;

    // Validate sell price
    if (typeof sellPrice !== 'number' || sellPrice < 0) {
      return NextResponse.json(
        { error: 'Invalid sell price' },
        { status: 400 }
      );
    }

    const database = db();

    // First, verify that the user owns this scroll
    const userScroll = await database
      .select()
      .from(userScrolls)
      .where(
        and(
          eq(userScrolls.userId, session.user.id),
          eq(userScrolls.scrollId, scrollId)
        )
      )
      .limit(1);

    if (!userScroll[0]) {
      return NextResponse.json(
        { error: 'Scroll not found or not owned by user' },
        { status: 404 }
      );
    }

    // Get the scroll details to check if it's consumed
    const scroll = await database
      .select()
      .from(scrolls)
      .where(eq(scrolls.id, scrollId))
      .limit(1);

    if (!scroll[0]) {
      return NextResponse.json({ error: 'Scroll not found' }, { status: 404 });
    }

    // Check if scroll is consumed - cannot sell consumed scrolls
    if (scroll[0].consumedBy) {
      return NextResponse.json(
        { error: 'Cannot sell a consumed scroll' },
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

    // Remove the scroll from user's inventory (delete the ownership record)
    await database
      .delete(userScrolls)
      .where(
        and(
          eq(userScrolls.userId, session.user.id),
          eq(userScrolls.scrollId, scrollId)
        )
      );

    // Delete the scroll itself since it's no longer owned by anyone
    await database.delete(scrolls).where(eq(scrolls.id, scrollId));

    return NextResponse.json({
      success: true,
      message: `Scroll sold for ${sellPrice} gold pieces${
        updateHouseGold ? ' and added to house treasury' : ''
      }`,
      sellPrice,
      updatedHouseGold: updateHouseGold,
    });
  } catch (error) {
    console.error('Error selling scroll:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
