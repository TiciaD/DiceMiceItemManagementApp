import { NextResponse } from 'next/server';
import { getAllWeaponTemplates } from '@/lib/weapon-service';

export async function GET() {
  try {
    const templates = await getAllWeaponTemplates();

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching weapon templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weapon templates' },
      { status: 500 }
    );
  }
}
