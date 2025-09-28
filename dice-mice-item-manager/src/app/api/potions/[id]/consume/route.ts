import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { potions, userPotions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { consumedBy, consumedAt, actualPotency } = await request.json();
    const { id: potionId } = await params;

    if (!potionId) {
      return NextResponse.json({ error: 'Invalid potion ID' }, { status: 400 });
    }

    if (!consumedBy?.trim()) {
      return NextResponse.json(
        { error: 'Consumer name is required' },
        { status: 400 }
      );
    }

    if (!consumedAt) {
      return NextResponse.json(
        { error: 'Consumption date is required' },
        { status: 400 }
      );
    }

    // Check if the potion exists and belongs to this user
    const existingPotion = await db()
      .select()
      .from(potions)
      .innerJoin(userPotions, eq(potions.id, userPotions.potionId))
      .where(
        and(
          eq(potions.id, potionId),
          eq(userPotions.userId, session.user.email)
        )
      )
      .limit(1);

    if (existingPotion.length === 0) {
      return NextResponse.json({ error: 'Potion not found' }, { status: 404 });
    }

    // Check if already consumed
    if (existingPotion[0].potions.consumedBy) {
      return NextResponse.json(
        { error: 'Potion has already been consumed' },
        { status: 400 }
      );
    }

    // If the potion was success_unknown, we need to update the potency
    const updateData: any = {
      consumedBy: consumedBy.trim(),
      consumedAt: new Date(consumedAt),
    };

    // If actualPotency is provided (for success_unknown potions), update the crafted potency
    if (
      actualPotency &&
      existingPotion[0].potions.craftedPotency === 'success_unknown'
    ) {
      if (!['success', 'critical_success'].includes(actualPotency)) {
        return NextResponse.json(
          { error: 'Invalid actual potency for unknown success potion' },
          { status: 400 }
        );
      }
      updateData.craftedPotency = actualPotency;
    }

    // Update the potion to mark as consumed
    const updatedPotion = await db()
      .update(potions)
      .set(updateData)
      .where(eq(potions.id, potionId))
      .returning();

    return NextResponse.json({
      success: true,
      potion: updatedPotion[0],
    });
  } catch (error) {
    console.error('Error consuming potion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
