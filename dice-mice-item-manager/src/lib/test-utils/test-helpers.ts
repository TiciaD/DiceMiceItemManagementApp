import { NextRequest } from 'next/server';

// Mock NextAuth session for testing
export const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'BASIC' as const,
  },
  expires: '2024-12-31T23:59:59.999Z',
};

// Mock DM session for testing admin features
export const mockDMSession = {
  user: {
    id: 'test-dm-id',
    email: 'dm@example.com',
    name: 'Test DM',
    role: 'DM' as const,
  },
  expires: '2024-12-31T23:59:59.999Z',
};

// Helper to create mock NextRequest for API testing
export function createMockRequest(
  options: {
    method?: string;
    url?: string;
    body?: any;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
) {
  const {
    method = 'GET',
    url = 'http://localhost:3000',
    body,
    headers = {},
    searchParams = {},
  } = options;

  const searchParamsObj = new URLSearchParams(searchParams);
  const fullUrl = searchParamsObj.toString()
    ? `${url}?${searchParamsObj.toString()}`
    : url;

  const requestInit: RequestInit & { signal?: AbortSignal } = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(fullUrl, requestInit);
}

// Helper to parse response from API routes
export async function parseApiResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Mock fetch for client-side testing
export function mockFetch(mockResponses: Record<string, any> = {}) {
  const originalFetch = global.fetch;

  const mockImplementation = (url: string, options: any = {}) => {
    const method = options.method || 'GET';
    const key = `${method} ${url}`;

    if (mockResponses[key]) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponses[key]),
        text: () => Promise.resolve(JSON.stringify(mockResponses[key])),
      } as Response);
    }

    // Default to success response
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('{}'),
    } as Response);
  };

  // Type assertion for Jest mock
  global.fetch = mockImplementation as any;

  return () => {
    global.fetch = originalFetch;
  };
}
