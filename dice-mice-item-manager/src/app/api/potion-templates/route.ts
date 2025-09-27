import { NextResponse } from 'next/server';
import { getAllPotionTemplates } from '@/lib/potion-service';

export async function GET() {
  try {
    const templates = await getAllPotionTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching potion templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch potion templates' },
      { status: 500 }
    );
  }
}
