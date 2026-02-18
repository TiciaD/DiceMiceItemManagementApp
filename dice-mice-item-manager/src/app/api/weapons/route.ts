import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createWeapon, getUserWeapons } from '@/lib/weapon-service';
import { CreateWeaponFormData } from '@/types/weapons';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const weapons = await getUserWeapons(session.user.id);

    return NextResponse.json(weapons);
  } catch (error) {
    console.error('Error fetching user weapons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weapons' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const data: CreateWeaponFormData = await request.json();

    // Validate required fields
    if (!data.name || !data.handedness || !data.damageMode || !data.modeCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate damage types
    if (!data.damageTypes || data.damageTypes.length === 0) {
      return NextResponse.json(
        { error: 'At least one damage type is required' },
        { status: 400 }
      );
    }

    // Validate damage type count matches mode
    if (data.damageMode === 'single' && data.damageTypes.length !== 1) {
      return NextResponse.json(
        { error: 'Single damage mode requires exactly one damage type' },
        { status: 400 }
      );
    }

    if (data.damageMode === 'dual' && data.damageTypes.length !== 2) {
      return NextResponse.json(
        { error: 'Dual damage mode requires exactly two damage types' },
        { status: 400 }
      );
    }

    const createdBy = session.user.name || session.user.email || 'Unknown';
    const newWeapon = await createWeapon(data, session.user.id, createdBy);

    return NextResponse.json({
      success: true,
      weapon: newWeapon,
    });
  } catch (error) {
    console.error('Error creating weapon:', error);
    return NextResponse.json(
      { error: 'Failed to create weapon' },
      { status: 500 }
    );
  }
}
