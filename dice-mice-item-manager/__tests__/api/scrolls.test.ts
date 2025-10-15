/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/scrolls/route';

// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

// Mock auth options
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Mock the database client
jest.mock('@/db/client', () => ({
  db: jest.fn(),
}));

// Mock drizzle-orm
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
}));

// Mock the schema
jest.mock('@/db/schema', () => ({
  scrolls: {
    id: 'id',
    spellTemplateId: 'spellTemplateId',
    material: 'material',
    consumedBy: 'consumedBy',
    consumedAt: 'consumedAt',
    craftedBy: 'craftedBy',
    craftedAt: 'craftedAt',
    weight: 'weight',
  },
  userScrolls: {
    scrollId: 'scrollId',
    userId: 'userId',
  },
  spellTemplates: {
    id: 'id',
    name: 'name',
    school: 'school',
    level: 'level',
    baseEffect: 'baseEffect',
    associatedSkill: 'associatedSkill',
    inversionEffect: 'inversionEffect',
    masteryEffect: 'masteryEffect',
    isInvertable: 'isInvertable',
    isDiscovered: 'isDiscovered',
    isInversionPublic: 'isInversionPublic',
    propsJson: 'propsJson',
  },
}));

describe('/api/scrolls', () => {
  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
  };

  const mockUser = {
    user: {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { db } = require('@/db/client');
    const { getServerSession } = require('next-auth/next');
    const { eq } = require('drizzle-orm');

    // Reset all mock functions completely
    mockDb.select.mockClear();
    mockDb.from.mockClear();
    mockDb.where.mockClear();
    mockDb.limit.mockClear();
    mockDb.insert.mockClear();
    mockDb.values.mockClear();
    mockDb.returning.mockClear();

    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.limit.mockReturnThis();
    mockDb.insert.mockReturnThis();
    mockDb.values.mockReturnThis();
    mockDb.returning.mockReturnThis();

    db.mockReturnValue(mockDb);
    getServerSession.mockResolvedValue(mockUser);
    eq.mockReturnValue('eq-result');
  });

  describe('POST /api/scrolls', () => {
    const validScrollData = {
      spellTemplateId: 'spell123',
      material: 'vellum',
      craftedBy: 'Gandalf the Grey',
      crafterLevel: 5,
      weight: 0.1,
    };

    it('should create a scroll successfully', async () => {
      const mockSpellTemplate = {
        id: 'spell123',
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
      };

      const mockCreatedScroll = {
        id: 'scroll123',
        spellTemplateId: 'spell123',
        material: 'vellum',
        consumedBy: null,
        consumedAt: null,
        craftedBy: 'Gandalf the Grey',
        craftedAt: '2025-10-14T21:11:20.239Z',
        weight: 0.1,
      };

      // Mock spell template lookup
      mockDb.limit.mockResolvedValue([mockSpellTemplate]);
      // Mock scroll creation - only one returning call, userScrolls insert doesn't return
      mockDb.returning.mockClear();
      mockDb.returning.mockResolvedValueOnce([mockCreatedScroll]);

      const request = new NextRequest('http://localhost/api/scrolls', {
        method: 'POST',
        body: JSON.stringify(validScrollData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockCreatedScroll);
      expect(mockDb.select).toHaveBeenCalledTimes(1);
      expect(mockDb.insert).toHaveBeenCalledTimes(2); // scroll + userScroll
    });

    it('should reject unauthenticated requests', async () => {
      const { getServerSession } = require('next-auth/next');
      getServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/scrolls', {
        method: 'POST',
        body: JSON.stringify(validScrollData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Authentication required' });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        spellTemplateId: 'spell123',
        // missing material, craftedBy, crafterLevel, weight
      };

      const request = new NextRequest('http://localhost/api/scrolls', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Missing required fields' });
    });

    it('should reject invalid spell template', async () => {
      // Mock spell template not found
      mockDb.limit.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/scrolls', {
        method: 'POST',
        body: JSON.stringify(validScrollData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Spell template not found' });
    });

    it('should enforce crafter level restrictions', async () => {
      const mockHighLevelSpell = {
        id: 'spell123',
        name: 'Wish',
        school: 'conjuration',
        level: 9,
        baseEffect: 'Grant a wish',
        associatedSkill: 'Arcana',
        inversionEffect: null,
        masteryEffect: null,
        isInvertable: false,
        isDiscovered: true,
        isInversionPublic: false,
        propsJson: null,
      };

      const lowLevelCrafter = {
        ...validScrollData,
        crafterLevel: 2, // Can only craft up to level 3
      };

      mockDb.limit.mockResolvedValue([mockHighLevelSpell]);

      const request = new NextRequest('http://localhost/api/scrolls', {
        method: 'POST',
        body: JSON.stringify(lowLevelCrafter),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain(
        'Cannot craft level 9 spell with crafter level 2'
      );
    });

    it('should allow crafting spells at or below crafter level + 1', async () => {
      const mockSpellTemplate = {
        id: 'spell123',
        name: 'Magic Missile',
        school: 'evocation',
        level: 1,
        baseEffect: 'Three darts of force',
        associatedSkill: 'Arcana',
        inversionEffect: null,
        masteryEffect: null,
        isInvertable: false,
        isDiscovered: true,
        isInversionPublic: false,
        propsJson: null,
      };

      const mockCreatedScroll = {
        id: 'scroll123',
        spellTemplateId: 'spell123',
        material: 'paper',
        consumedBy: null,
        consumedAt: null,
        craftedBy: 'Novice Wizard',
        craftedAt: '2025-10-14T21:11:20.282Z',
        weight: 0.05,
      };

      const noviceCrafter = {
        ...validScrollData,
        crafterLevel: 1, // Can craft up to level 2
        craftedBy: 'Novice Wizard',
        material: 'paper',
        weight: 0.05,
      };

      mockDb.limit.mockResolvedValue([mockSpellTemplate]);
      // Clear and reset the returning mock to avoid interference from previous tests
      mockDb.returning.mockClear();
      // Only one returning call for scroll creation, userScrolls insert doesn't return
      mockDb.returning.mockResolvedValueOnce([mockCreatedScroll]);

      const request = new NextRequest('http://localhost/api/scrolls', {
        method: 'POST',
        body: JSON.stringify(noviceCrafter),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockCreatedScroll);
    });

    it('should handle different materials', async () => {
      const mockSpellTemplate = {
        id: 'spell123',
        name: 'Healing Word',
        school: 'evocation',
        level: 1,
        baseEffect: 'Heal 1d4 + spell mod HP',
        associatedSkill: 'Medicine',
        inversionEffect: null,
        masteryEffect: null,
        isInvertable: false,
        isDiscovered: true,
        isInversionPublic: false,
        propsJson: null,
      };

      const materials = ['paper', 'vellum', 'parchment', 'bark'];

      for (const material of materials) {
        const mockCreatedScroll = {
          id: `scroll_${material}`,
          spellTemplateId: 'spell123',
          material,
          consumedBy: null,
          consumedAt: null,
          craftedBy: 'Test Crafter',
          craftedAt: '2025-10-14T21:11:20.300Z',
          weight: 0.1,
        };

        mockDb.limit.mockResolvedValue([mockSpellTemplate]);
        // Clear and reset the returning mock for each iteration
        mockDb.returning.mockClear();
        // Only one returning call for scroll creation, userScrolls insert doesn't return
        mockDb.returning.mockResolvedValueOnce([mockCreatedScroll]);

        const scrollData = {
          ...validScrollData,
          material,
        };

        const request = new NextRequest('http://localhost/api/scrolls', {
          method: 'POST',
          body: JSON.stringify(scrollData),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.material).toBe(material);
      }
    });

    it('should handle database errors gracefully', async () => {
      mockDb.limit.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost/api/scrolls', {
        method: 'POST',
        body: JSON.stringify(validScrollData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to create scroll' });
    });

    it('should convert weight to number', async () => {
      const mockSpellTemplate = {
        id: 'spell123',
        name: 'Light',
        school: 'evocation',
        level: 0,
        baseEffect: 'Create bright light',
        associatedSkill: 'Arcana',
        inversionEffect: null,
        masteryEffect: null,
        isInvertable: false,
        isDiscovered: true,
        isInversionPublic: false,
        propsJson: null,
      };

      const mockCreatedScroll = {
        id: 'scroll123',
        spellTemplateId: 'spell123',
        material: 'paper',
        consumedBy: null,
        consumedAt: null,
        craftedBy: 'Test Crafter',
        craftedAt: '2025-10-14T21:11:20.350Z',
        weight: 0.01,
      };

      const scrollDataWithStringWeight = {
        ...validScrollData,
        weight: '0.01', // String weight should be converted to number
      };

      mockDb.limit.mockResolvedValue([mockSpellTemplate]);
      // Clear and reset the returning mock to avoid interference
      mockDb.returning.mockClear();
      // Only one returning call for scroll creation, userScrolls insert doesn't return
      mockDb.returning.mockResolvedValueOnce([mockCreatedScroll]);

      const request = new NextRequest('http://localhost/api/scrolls', {
        method: 'POST',
        body: JSON.stringify(scrollDataWithStringWeight),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(typeof data.weight).toBe('number');
      expect(data.weight).toBe(0.01);
    });
  });
});
