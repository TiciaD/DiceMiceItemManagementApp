import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { scrolls, userScrolls, spellTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { spellTemplateId, material, craftedBy, crafterLevel, weight } =
      await request.json();

    if (
      !spellTemplateId ||
      !material ||
      !craftedBy ||
      !crafterLevel ||
      weight == null
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const database = db();

    // Validate crafting level restrictions
    const [spellTemplate] = await database
      .select()
      .from(spellTemplates)
      .where(eq(spellTemplates.id, spellTemplateId))
      .limit(1);

    if (!spellTemplate) {
      return NextResponse.json(
        { error: 'Spell template not found' },
        { status: 404 }
      );
    }

    const maxCraftableLevel = crafterLevel + 1;
    if (spellTemplate.level > maxCraftableLevel) {
      return NextResponse.json(
        {
          error: `Cannot craft level ${spellTemplate.level} spell with crafter level ${crafterLevel}. Maximum craftable: level ${maxCraftableLevel}`,
        },
        { status: 400 }
      );
    }

    // Create the scroll
    const [scroll] = await database
      .insert(scrolls)
      .values({
        spellTemplateId,
        material,
        craftedBy,
        weight: Number(weight),
      })
      .returning();

    // Add scroll to user's inventory
    await database.insert(userScrolls).values({
      scrollId: scroll.id,
      userId: session.user.id,
    });

    return NextResponse.json(scroll, { status: 201 });
  } catch (error) {
    console.error('Error creating scroll:', error);
    return NextResponse.json(
      { error: 'Failed to create scroll' },
      { status: 500 }
    );
  }
}
