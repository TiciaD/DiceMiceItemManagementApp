import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createPotionInstance } from '@/lib/potion-service';
import { CreatePotionFormData } from '@/types/potions';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const data: CreatePotionFormData = await request.json();

    // Validate required fields
    if (!data.potionTemplateId || !data.craftedBy || !data.craftedPotency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert craftedAt to Date if it's a string
    if (typeof data.craftedAt === 'string') {
      data.craftedAt = new Date(data.craftedAt);
    }

    const newPotion = await createPotionInstance(data, session.user.id);

    return NextResponse.json({
      success: true,
      potion: newPotion,
    });
  } catch (error) {
    console.error('Error creating potion:', error);
    return NextResponse.json(
      { error: 'Failed to create potion' },
      { status: 500 }
    );
  }
}
