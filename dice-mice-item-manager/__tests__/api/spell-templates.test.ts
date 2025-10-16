/**
 * @jest-environment node
 */

// Mock data factory
const createMockSpellTemplate = (overrides = {}) => ({
  id: 'spell1',
  name: 'Fireball',
  school: 'evocation',
  level: 3,
  baseEffect: 'Deals 8d6 fire damage',
  associatedSkill: 'Arcana',
  inversionEffect: null,
  masteryEffect: null,
  isInvertable: false,
  isDiscovered: true,
  isInversionPublic: false,
  propsJson: null,
  ...overrides,
});

// Mock database behavior
const createMockDatabase = () => {
  const mockData = {
    spellTemplates: [] as any[],
  };

  const db = () => ({
    select: () => ({
      from: (table: string) => {
        if (table === 'spellTemplates') {
          return Promise.resolve(mockData.spellTemplates);
        }
        return Promise.resolve([]);
      },
    }),
  });

  return { db, mockData };
};

describe('/api/spell-templates', () => {
  let mockDatabase: any;
  let GET: any;

  beforeAll(() => {
    mockDatabase = createMockDatabase();

    // Mock modules
    jest.doMock('@/db/client', () => ({
      db: mockDatabase.db,
    }));

    jest.doMock('@/db/schema', () => ({
      spellTemplates: 'spellTemplates',
    }));

    // Import after mocking
    GET = require('@/app/api/spell-templates/route').GET;
  });

  beforeEach(() => {
    // Reset mock data
    mockDatabase.mockData.spellTemplates = [];
  });

  describe('GET /api/spell-templates', () => {
    it('should return spell templates successfully', async () => {
      const mockSpellTemplates = [
        createMockSpellTemplate({
          id: 'spell1',
          name: 'Fireball',
          school: 'evocation',
          level: 3,
        }),
        createMockSpellTemplate({
          id: 'spell2',
          name: 'Magic Missile',
          school: 'evocation',
          level: 1,
          baseEffect: 'Three darts of magical force',
        }),
        createMockSpellTemplate({
          id: 'spell3',
          name: 'Healing Word',
          level: 1,
          baseEffect: 'Heal 1d4 + spell mod HP',
          associatedSkill: 'Medicine',
          inversionEffect: 'Deal 1d4 + spell mod damage',
          masteryEffect: 'Heal an additional 1d4',
          isInvertable: true,
          isInversionPublic: true,
          propsJson: '{"tags": ["healing", "bonus action"]}',
        }),
      ];

      mockDatabase.mockData.spellTemplates = mockSpellTemplates;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSpellTemplates);
    });

    it('should return empty array when no spell templates exist', async () => {
      mockDatabase.mockData.spellTemplates = [];

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error by overriding the db function temporarily
      const originalDb = mockDatabase.db;
      mockDatabase.db = () => ({
        select: () => ({
          from: () => Promise.reject(new Error('Database connection failed')),
        }),
      });

      // Re-mock the module with the error-throwing db
      jest.resetModules();
      jest.doMock('@/db/client', () => ({
        db: mockDatabase.db,
      }));

      // Re-import the route handler
      const { GET: ErrorGET } = require('@/app/api/spell-templates/route');

      const response = await ErrorGET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch spell templates' });

      // Restore original db function
      mockDatabase.db = originalDb;
    });

    it('should return spells with different schools', async () => {
      const mockSpellTemplates = [
        createMockSpellTemplate({
          id: 'spell1',
          name: 'Fireball',
          school: 'evocation',
          level: 3,
        }),
        createMockSpellTemplate({
          id: 'spell2',
          name: 'Charm Person',
          school: 'enchantment',
          level: 1,
          baseEffect: 'Charm a humanoid',
          associatedSkill: 'Persuasion',
        }),
        createMockSpellTemplate({
          id: 'spell3',
          name: 'Detect Magic',
          school: 'divination',
          level: 1,
          baseEffect: 'Sense magic within 30 feet',
          associatedSkill: 'Investigation',
        }),
      ];

      mockDatabase.mockData.spellTemplates = mockSpellTemplates;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(3);
      expect(data.map((spell: any) => spell.school)).toEqual([
        'evocation',
        'enchantment',
        'divination',
      ]);
    });

    it('should return spells with different levels', async () => {
      const mockSpellTemplates = [
        createMockSpellTemplate({
          id: 'cantrip1',
          name: 'Light',
          school: 'evocation',
          level: 0,
          baseEffect: 'Create bright light',
        }),
        createMockSpellTemplate({
          id: 'spell1',
          name: 'Magic Missile',
          level: 1,
          baseEffect: 'Three darts of force',
        }),
        createMockSpellTemplate({
          id: 'spell9',
          name: 'Wish',
          school: 'conjuration',
          level: 9,
          baseEffect: 'Grant a wish',
          isDiscovered: false,
        }),
      ];

      mockDatabase.mockData.spellTemplates = mockSpellTemplates;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.map((spell: any) => spell.level)).toEqual([0, 1, 9]);
    });

    it('should handle spells with inversion mechanics', async () => {
      const mockSpellTemplates = [
        createMockSpellTemplate({
          id: 'spell1',
          name: 'Healing Word',
          level: 1,
          baseEffect: 'Heal 1d4 + spell mod HP',
          associatedSkill: 'Medicine',
          inversionEffect: 'Deal 1d4 + spell mod damage',
          masteryEffect: 'Heal an additional 1d4',
          isInvertable: true,
          isInversionPublic: true,
          propsJson: '{"tags": ["healing", "inversion"]}',
        }),
      ];

      mockDatabase.mockData.spellTemplates = mockSpellTemplates;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].isInvertable).toBe(true);
      expect(data[0].inversionEffect).toBe('Deal 1d4 + spell mod damage');
      expect(data[0].isInversionPublic).toBe(true);
    });
  });
});
