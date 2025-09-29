import { db } from '@/db/client';
import { houses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { House, NewHouse } from '@/types/houses';

export class HouseService {
  // Get house by user ID
  static async getHouseByUserId(userId: string): Promise<House | null> {
    const database = db();
    const result = await database
      .select()
      .from(houses)
      .where(eq(houses.userId, userId))
      .limit(1);

    return result[0] || null;
  }

  // Create a new house
  static async createHouse(houseData: NewHouse): Promise<House> {
    const database = db();
    const [newHouse] = await database
      .insert(houses)
      .values(houseData)
      .returning();

    return newHouse;
  }

  // Update house
  static async updateHouse(
    houseId: string,
    updates: Partial<NewHouse>
  ): Promise<House | null> {
    const database = db();
    const [updatedHouse] = await database
      .update(houses)
      .set(updates)
      .where(eq(houses.id, houseId))
      .returning();

    return updatedHouse || null;
  }

  // Update gold amount
  static async updateGold(
    houseId: string,
    goldAmount: number
  ): Promise<House | null> {
    const database = db();
    const [updatedHouse] = await database
      .update(houses)
      .set({ gold: goldAmount })
      .where(eq(houses.id, houseId))
      .returning();

    return updatedHouse || null;
  }

  // Add gold to existing amount
  static async addGold(
    houseId: string,
    goldToAdd: number
  ): Promise<House | null> {
    const database = db();
    // First get the current house to calculate new gold amount
    const currentHouse = await database
      .select()
      .from(houses)
      .where(eq(houses.id, houseId))
      .limit(1);

    if (!currentHouse[0]) return null;

    const newGoldAmount = currentHouse[0].gold + goldToAdd;

    const [updatedHouse] = await database
      .update(houses)
      .set({ gold: newGoldAmount })
      .where(eq(houses.id, houseId))
      .returning();

    return updatedHouse || null;
  }

  // Delete house
  static async deleteHouse(houseId: string): Promise<boolean> {
    try {
      const database = db();
      await database.delete(houses).where(eq(houses.id, houseId));

      return true;
    } catch (error) {
      console.error('Error deleting house:', error);
      return false;
    }
  }
}
