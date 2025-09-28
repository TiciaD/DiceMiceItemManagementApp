import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { scrolls, userScrolls, spellTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const database = db();

    // Get user's scrolls with spell template information
    const userScrollsWithTemplates = await database
      .select({
        // Scroll data
        scrollId: scrolls.id,
        material: scrolls.material,
        consumedBy: scrolls.consumedBy,
        consumedAt: scrolls.consumedAt,
        craftedBy: scrolls.craftedBy,
        craftedAt: scrolls.craftedAt,
        weight: scrolls.weight,
        // Spell template data
        spellTemplateId: spellTemplates.id,
        spellName: spellTemplates.name,
        spellSchool: spellTemplates.school,
        spellLevel: spellTemplates.level,
        baseEffect: spellTemplates.baseEffect,
        associatedSkill: spellTemplates.associatedSkill,
        inversionEffect: spellTemplates.inversionEffect,
        masteryEffect: spellTemplates.masteryEffect,
        isInvertable: spellTemplates.isInvertable,
        isDiscovered: spellTemplates.isDiscovered,
        isInversionPublic: spellTemplates.isInversionPublic,
        propsJson: spellTemplates.propsJson,
      })
      .from(userScrolls)
      .innerJoin(scrolls, eq(userScrolls.scrollId, scrolls.id))
      .innerJoin(spellTemplates, eq(scrolls.spellTemplateId, spellTemplates.id))
      .where(eq(userScrolls.userId, session.user.id));

    // Transform the data to match our ScrollWithTemplate type
    const formattedScrolls = userScrollsWithTemplates.map((row) => ({
      id: row.scrollId,
      spellTemplateId: row.spellTemplateId,
      material: row.material,
      consumedBy: row.consumedBy,
      consumedAt: row.consumedAt,
      craftedBy: row.craftedBy,
      craftedAt: row.craftedAt,
      weight: row.weight,
      template: {
        id: row.spellTemplateId,
        name: row.spellName,
        school: row.spellSchool,
        level: row.spellLevel,
        baseEffect: row.baseEffect,
        associatedSkill: row.associatedSkill,
        inversionEffect: row.inversionEffect,
        masteryEffect: row.masteryEffect,
        isInvertable: row.isInvertable,
        isDiscovered: row.isDiscovered,
        isInversionPublic: row.isInversionPublic,
        propsJson: row.propsJson,
        propsData: row.propsJson ? JSON.parse(row.propsJson) : undefined,
      },
    }));

    return NextResponse.json(formattedScrolls);
  } catch (error) {
    console.error('Error fetching user scrolls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scrolls' },
      { status: 500 }
    );
  }
}
