import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { potions, userPotions, potionTemplates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      consumedBy,
      consumedAt,
      actualPotency,
      amountUsed,
      isFullConsumption,
    } = await request.json();
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
      .innerJoin(
        potionTemplates,
        eq(potions.potionTemplateId, potionTemplates.id)
      )
      .where(
        and(eq(potions.id, potionId), eq(userPotions.userId, session.user.id))
      )
      .limit(1);

    if (existingPotion.length === 0) {
      return NextResponse.json({ error: 'Potion not found' }, { status: 404 });
    }

    const potion = existingPotion[0].potions;
    const template = existingPotion[0].potion_templates;

    // Check if already fully consumed
    if (
      potion.isFullyConsumed ||
      (potion.consumedBy && !template.splitAmount)
    ) {
      return NextResponse.json(
        { error: 'Potion has already been consumed' },
        { status: 400 }
      );
    }

    // Determine consumption type
    const isPartialConsumption = template.splitAmount && !isFullConsumption;

    // If the potion was success_unknown, we need to update the potency
    const updateData: any = {
      consumedAt: new Date(consumedAt),
    };

    if (isPartialConsumption) {
      // For partial consumption, track the amount used and remaining
      updateData.usedAmount = amountUsed || template.splitAmount;
      updateData.remainingAmount = template.splitAmount; // This would need more complex logic for actual calculation
      updateData.isFullyConsumed = false;

      // Only set consumedBy on first consumption
      if (!potion.consumedBy) {
        updateData.consumedBy = consumedBy.trim();
      }
    } else {
      // For full consumption
      updateData.consumedBy = consumedBy.trim();
      updateData.isFullyConsumed = true;
      updateData.usedAmount = template.splitAmount || 'Full Potion';
      updateData.remainingAmount = null;
    }

    // If actualPotency is provided (for success_unknown potions), update the crafted potency
    if (actualPotency && potion.craftedPotency === 'success_unknown') {
      if (!['success', 'critical_success'].includes(actualPotency)) {
        return NextResponse.json(
          { error: 'Invalid actual potency for unknown success potion' },
          { status: 400 }
        );
      }
      updateData.craftedPotency = actualPotency;
    }

    // Update the potion
    const updatedPotion = await db()
      .update(potions)
      .set(updateData)
      .where(eq(potions.id, potionId))
      .returning();

    return NextResponse.json({
      success: true,
      potion: updatedPotion[0],
      isPartialConsumption,
    });
  } catch (error) {
    console.error('Error consuming potion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
