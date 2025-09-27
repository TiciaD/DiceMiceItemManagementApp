import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserPotions } from '@/lib/potion-service';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userPotions = await getUserPotions(session.user.id);

    return NextResponse.json(userPotions);
  } catch (error) {
    console.error('Error fetching user potions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user potions' },
      { status: 500 }
    );
  }
}
