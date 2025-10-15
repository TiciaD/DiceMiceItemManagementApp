import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from '@/db/schema';
import { resolve } from 'path';
import { randomBytes } from 'crypto';

// Generate a unique database name for each test run
export function generateTestDbName(): string {
  return `test_${randomBytes(8).toString('hex')}.db`;
}

// Create a test database instance
export function createTestDb(dbName?: string) {
  const testDbName = dbName || generateTestDbName();
  const testDbUrl = `file:${testDbName}`;

  const client = createClient({
    url: testDbUrl,
  });

  const db = drizzle(client, { schema });

  return { db, client };
}

// Setup test database with migrations
export async function setupTestDatabase() {
  const { db, client } = createTestDb();

  try {
    // Run migrations
    await migrate(db, {
      migrationsFolder: resolve(process.cwd(), 'src/db/migrations'),
    });

    return {
      db,
      client,
      cleanup: () => cleanupTestDatabase(client),
    };
  } catch (error) {
    // Cleanup on error
    await client.close();
    throw error;
  }
}

// Cleanup test database
export async function cleanupTestDatabase(client: any) {
  try {
    await client.close();
    // For file-based SQLite, we might want to delete the file
    // In production tests, this would depend on your setup
  } catch (error) {
    console.warn('Error cleaning up test database:', error);
  }
}

// Test data factories
export const testDataFactories = {
  createUser: (overrides: Partial<typeof schema.users.$inferInsert> = {}) => ({
    name: 'Test User',
    email: 'test@example.com',
    role: 'BASIC' as const,
    ...overrides,
  }),

  createHouse: (
    userId: string,
    overrides: Partial<typeof schema.houses.$inferInsert> = {}
  ) => ({
    name: 'Test House',
    userId,
    countyId: 't1i7dfmcoaycjux7fz7njd1n', // Default county ID
    motto: 'Test Motto',
    bio: 'Test Bio',
    gold: 100,
    ...overrides,
  }),

  createCharacter: (
    userId: string,
    houseId: string,
    overrides: Partial<typeof schema.characters.$inferInsert> = {}
  ) => ({
    name: 'Test Character',
    userId,
    houseId,
    countyId: 't1i7dfmcoaycjux7fz7njd1n',
    classId: 'test-class-id',
    currentLevel: 1,
    currentHP: 10,
    maxHP: 10,
    currentSTR: 14,
    currentCON: 12,
    currentDEX: 16,
    currentINT: 10,
    currentWIS: 13,
    currentCHA: 8,
    experience: 0,
    ...overrides,
  }),

  createPotionTemplate: (
    overrides: Partial<typeof schema.potionTemplates.$inferInsert> = {}
  ) => ({
    name: 'Test Healing Potion',
    level: 1,
    school: 'Evocation',
    rarity: 'common' as const,
    potencyFailEffect: 'No effect',
    potencySuccessEffect: 'Heal 1d4+1 HP',
    potencyCriticalSuccessEffect: 'Heal 2d4+2 HP',
    description: 'A basic healing potion',
    cost: 50,
    isDiscovered: true,
    ...overrides,
  }),

  createPotion: (
    potionTemplateId: string,
    overrides: Partial<typeof schema.potions.$inferInsert> = {}
  ) => ({
    customId: 'TEST-001',
    potionTemplateId,
    craftedPotency: 'success' as const,
    craftedBy: 'Test Crafter',
    weight: 0.5,
    ...overrides,
  }),
};

// Helper to seed test data
export async function seedTestData(db: any) {
  // Insert default county
  const [county] = await db
    .insert(schema.counties)
    .values({
      id: 't1i7dfmcoaycjux7fz7njd1n',
      name: 'Test County',
      description: 'A test county for testing',
      associatedStat: 'STR',
      associatedSkills: 'Test Skills',
    })
    .returning();

  // Insert default class
  const [testClass] = await db
    .insert(schema.classes)
    .values({
      id: 'test-class-id',
      name: 'Test Class',
      description: 'A test class for testing',
      prerequisiteStat1: 'STR',
      willpowerProgression: 'even_levels',
      hitDie: '1d6',
    })
    .returning();

  return { county, testClass };
}
