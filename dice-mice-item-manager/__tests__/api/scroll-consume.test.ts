/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/scrolls/[id]/consume/route';

// Mock next-auth
jest.mock('next-auth', () => ({
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
  and: jest.fn(),
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
}));

describe('/api/scrolls/[id]/consume', () => {
  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
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
    const { getServerSession } = require('next-auth');
    const { eq, and } = require('drizzle-orm');

    db.mockReturnValue(mockDb);
    getServerSession.mockResolvedValue(mockUser);
    eq.mockReturnValue('eq-result');
    and.mockReturnValue('and-result');
  });

  describe('POST /api/scrolls/[id]/consume', () => {
    const validConsumptionData = {
      consumedBy: 'Aragorn',
      consumedAt: '2023-12-01T12:00:00.000Z',
    };

    const mockScrollData = [
      {
        scrolls: {
          id: 'scroll123',
          spellTemplateId: 'spell123',
          material: 'vellum',
          consumedBy: null,
          consumedAt: null,
          craftedBy: 'Gandalf',
          craftedAt: new Date('2023-11-01T10:00:00.000Z'),
          weight: 0.1,
        },
        userScrolls: {
          scrollId: 'scroll123',
          userId: 'user123',
        },
      },
    ];

    it('should consume a scroll successfully', async () => {
      const updatedScroll = {
        id: 'scroll123',
        spellTemplateId: 'spell123',
        material: 'vellum',
        consumedBy: 'Aragorn',
        consumedAt: '2023-12-01T12:00:00.000Z',
        craftedBy: 'Gandalf',
        craftedAt: '2023-11-01T10:00:00.000Z',
        weight: 0.1,
      };

      // Mock scroll lookup
      mockDb.limit.mockResolvedValue(mockScrollData);
      // Mock scroll update
      mockDb.returning.mockResolvedValue([updatedScroll]);

      const request = new NextRequest(
        'http://localhost/api/scrolls/scroll123/consume',
        {
          method: 'POST',
          body: JSON.stringify(validConsumptionData),
        }
      );

      const params = Promise.resolve({ id: 'scroll123' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.scroll).toEqual(updatedScroll);
      expect(data.scroll.consumedBy).toBe('Aragorn');
      expect(data.scroll.consumedAt).toBe('2023-12-01T12:00:00.000Z');
    });

    it('should reject unauthenticated requests', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost/api/scrolls/scroll123/consume',
        {
          method: 'POST',
          body: JSON.stringify(validConsumptionData),
        }
      );

      const params = Promise.resolve({ id: 'scroll123' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should validate required consumedBy field', async () => {
      const invalidData = {
        consumedBy: '',
        consumedAt: '2023-12-01T12:00:00.000Z',
      };

      const request = new NextRequest(
        'http://localhost/api/scrolls/scroll123/consume',
        {
          method: 'POST',
          body: JSON.stringify(invalidData),
        }
      );

      const params = Promise.resolve({ id: 'scroll123' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Consumer name is required' });
    });

    it('should validate required consumedAt field', async () => {
      const invalidData = {
        consumedBy: 'Aragorn',
        consumedAt: '',
      };

      const request = new NextRequest(
        'http://localhost/api/scrolls/scroll123/consume',
        {
          method: 'POST',
          body: JSON.stringify(invalidData),
        }
      );

      const params = Promise.resolve({ id: 'scroll123' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Consumption date is required' });
    });

    it('should reject invalid scroll ID', async () => {
      const request = new NextRequest('http://localhost/api/scrolls//consume', {
        method: 'POST',
        body: JSON.stringify(validConsumptionData),
      });

      const params = Promise.resolve({ id: '' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid scroll ID' });
    });

    it('should reject scroll not found', async () => {
      // Mock scroll not found
      mockDb.limit.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost/api/scrolls/nonexistent/consume',
        {
          method: 'POST',
          body: JSON.stringify(validConsumptionData),
        }
      );

      const params = Promise.resolve({ id: 'nonexistent' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Scroll not found' });
    });

    it('should reject scroll not owned by user', async () => {
      // Mock scroll lookup returns empty (filtered by user)
      mockDb.limit.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost/api/scrolls/scroll123/consume',
        {
          method: 'POST',
          body: JSON.stringify(validConsumptionData),
        }
      );

      const params = Promise.resolve({ id: 'scroll123' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Scroll not found' });
    });

    it('should reject already consumed scroll', async () => {
      const alreadyConsumedScroll = [
        {
          scrolls: {
            id: 'scroll123',
            spellTemplateId: 'spell123',
            material: 'vellum',
            consumedBy: 'Legolas',
            consumedAt: new Date('2023-11-15T09:00:00.000Z'),
            craftedBy: 'Gandalf',
            craftedAt: new Date('2023-11-01T10:00:00.000Z'),
            weight: 0.1,
          },
          userScrolls: {
            scrollId: 'scroll123',
            userId: 'user123',
          },
        },
      ];

      mockDb.limit.mockResolvedValue(alreadyConsumedScroll);

      const request = new NextRequest(
        'http://localhost/api/scrolls/scroll123/consume',
        {
          method: 'POST',
          body: JSON.stringify(validConsumptionData),
        }
      );

      const params = Promise.resolve({ id: 'scroll123' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Scroll has already been consumed' });
    });

    it('should trim consumer name', async () => {
      const dataWithWhitespace = {
        consumedBy: '   Frodo Baggins   ',
        consumedAt: '2023-12-01T12:00:00.000Z',
      };

      const updatedScroll = {
        id: 'scroll123',
        spellTemplateId: 'spell123',
        material: 'paper',
        consumedBy: 'Frodo Baggins',
        consumedAt: '2023-12-01T12:00:00.000Z',
        craftedBy: 'Gandalf',
        craftedAt: '2023-11-01T10:00:00.000Z',
        weight: 0.05,
      };

      mockDb.limit.mockResolvedValue(mockScrollData);
      mockDb.returning.mockResolvedValue([updatedScroll]);

      const request = new NextRequest(
        'http://localhost/api/scrolls/scroll123/consume',
        {
          method: 'POST',
          body: JSON.stringify(dataWithWhitespace),
        }
      );

      const params = Promise.resolve({ id: 'scroll123' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.scroll.consumedBy).toBe('Frodo Baggins');
    });

    it('should handle different date formats', async () => {
      const dateFormats = [
        '2023-12-01T12:00:00.000Z',
        '2023-12-01T12:00:00Z',
        '2023-12-01 12:00:00',
        '2023-12-01',
      ];

      for (const dateFormat of dateFormats) {
        const updatedScroll = {
          id: 'scroll123',
          spellTemplateId: 'spell123',
          material: 'vellum',
          consumedBy: 'Test Consumer',
          consumedAt: new Date(dateFormat).toISOString(),
          craftedBy: 'Gandalf',
          craftedAt: '2023-11-01T10:00:00.000Z',
          weight: 0.1,
        };

        mockDb.limit.mockResolvedValue(mockScrollData);
        mockDb.returning.mockResolvedValue([updatedScroll]);

        const request = new NextRequest(
          'http://localhost/api/scrolls/scroll123/consume',
          {
            method: 'POST',
            body: JSON.stringify({
              consumedBy: 'Test Consumer',
              consumedAt: dateFormat,
            }),
          }
        );

        const params = Promise.resolve({ id: 'scroll123' });
        const response = await POST(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(typeof data.scroll.consumedAt).toBe('string');
        expect(data.scroll.consumedAt).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
        );
      }
    });

    it('should handle database errors gracefully', async () => {
      mockDb.limit.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest(
        'http://localhost/api/scrolls/scroll123/consume',
        {
          method: 'POST',
          body: JSON.stringify(validConsumptionData),
        }
      );

      const params = Promise.resolve({ id: 'scroll123' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
    });

    it('should validate consumption timestamp order', async () => {
      // Scroll crafted after consumption date should still work (no validation in API)
      const futureConsumption = {
        consumedBy: 'Time Traveler',
        consumedAt: '2023-10-01T12:00:00.000Z', // Before craft date
      };

      const updatedScroll = {
        id: 'scroll123',
        spellTemplateId: 'spell123',
        material: 'vellum',
        consumedBy: 'Time Traveler',
        consumedAt: '2023-10-01T12:00:00.000Z',
        craftedBy: 'Gandalf',
        craftedAt: '2023-11-01T10:00:00.000Z',
        weight: 0.1,
      };

      mockDb.limit.mockResolvedValue(mockScrollData);
      mockDb.returning.mockResolvedValue([updatedScroll]);

      const request = new NextRequest(
        'http://localhost/api/scrolls/scroll123/consume',
        {
          method: 'POST',
          body: JSON.stringify(futureConsumption),
        }
      );

      const params = Promise.resolve({ id: 'scroll123' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
