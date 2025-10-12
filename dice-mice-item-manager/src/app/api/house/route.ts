import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { HouseService } from '@/lib/house-service';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const house = await HouseService.getHouseWithCountyByUserId(
      session.user.id
    );

    if (!house) {
      return NextResponse.json({ house: null }, { status: 200 });
    }

    return NextResponse.json({ house }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user house:', error);
    return NextResponse.json(
      { error: 'Failed to fetch house' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, motto, bio, countyId } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'House name is required' },
        { status: 400 }
      );
    }

    if (!countyId || typeof countyId !== 'string') {
      return NextResponse.json(
        { error: 'Origin county is required' },
        { status: 400 }
      );
    }

    // Check if user already has a house
    const existingHouse = await HouseService.getHouseByUserId(session.user.id);
    if (existingHouse) {
      return NextResponse.json(
        { error: 'User already has a house' },
        { status: 400 }
      );
    }

    // Create the house with county information
    const houseWithCounty = await HouseService.createHouseWithCounty({
      name: name.trim(),
      userId: session.user.id,
      countyId: countyId,
      motto: motto?.trim() || null,
      bio: bio?.trim() || null,
      gold: 0,
    });

    if (!houseWithCounty) {
      return NextResponse.json(
        { error: 'Failed to create house with county information' },
        { status: 500 }
      );
    }

    return NextResponse.json({ house: houseWithCounty }, { status: 201 });
  } catch (error) {
    console.error('Error creating house:', error);
    return NextResponse.json(
      { error: 'Failed to create house' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, motto, bio, gold } = body;

    // Get user's house
    const house = await HouseService.getHouseByUserId(session.user.id);
    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (motto !== undefined) updates.motto = motto?.trim() || null;
    if (bio !== undefined) updates.bio = bio?.trim() || null;
    if (gold !== undefined && typeof gold === 'number') {
      if (gold < 0) {
        return NextResponse.json(
          { error: 'Gold amount cannot be negative' },
          { status: 400 }
        );
      }
      updates.gold = gold;
    }

    const updatedHouse = await HouseService.updateHouse(house.id, updates);

    if (!updatedHouse) {
      return NextResponse.json(
        { error: 'Failed to update house' },
        { status: 500 }
      );
    }

    // Get the updated house with county information
    const houseWithCounty = await HouseService.getHouseWithCountyByUserId(
      session.user.id
    );

    return NextResponse.json({ house: houseWithCounty }, { status: 200 });
  } catch (error) {
    console.error('Error updating house:', error);
    return NextResponse.json(
      { error: 'Failed to update house' },
      { status: 500 }
    );
  }
}
