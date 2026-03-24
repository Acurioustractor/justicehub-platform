/**
 * Network API Auth Tests
 *
 * Verifies that POST /api/network/join and POST /api/network/validate
 * require an authenticated session.
 */

// Mock server-lite before importing routes
const mockGetUser = jest.fn();
jest.mock('@/lib/supabase/server-lite', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

// Mock service client (used for DB operations)
const mockFrom = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
});
jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: jest.fn(() => ({ from: mockFrom })),
}));

// Mock next/headers cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    getAll: jest.fn().mockReturnValue([]),
    set: jest.fn(),
  }),
}));

import { NextRequest } from 'next/server';

// Import route handlers
import { POST as joinPOST } from '@/app/api/network/join/route';
import { POST as validatePOST, GET as validateGET } from '@/app/api/network/validate/route';

function makeRequest(body: Record<string, any>, url = 'http://localhost:3004/api/network/join') {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(url: string) {
  return new NextRequest(url, { method: 'GET' });
}

describe('Network Join API - Auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 401 when no session exists', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = makeRequest({
      orgName: 'Test Org',
      contactName: 'Test',
      contactEmail: 'test@test.com',
      state: 'QLD',
    });

    const res = await joinPOST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Authentication required to join the network');
  });

  test('proceeds when session exists', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@test.com' } },
      error: null,
    });

    // Mock the chain for org lookup (no match) then insert
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    const req = makeRequest({
      orgName: 'Test Org',
      contactName: 'Test',
      contactEmail: 'test@test.com',
      state: 'QLD',
    });

    const res = await joinPOST(req);

    // Should NOT be 401 - it may fail on DB ops but auth passed
    expect(res.status).not.toBe(401);
  });
});

describe('Network Validate API - Auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST returns 401 when no session exists', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = makeRequest(
      {
        fromOrgId: 'org-1',
        toOrgId: 'org-2',
        validationType: 'endorsement',
        content: 'Great org',
        validatorName: 'Test Person',
      },
      'http://localhost:3004/api/network/validate'
    );

    const res = await validatePOST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Authentication required to submit validations');
  });

  test('POST proceeds when session exists', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@test.com' } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'v-1' }, error: null }),
    });

    const req = makeRequest(
      {
        fromOrgId: 'org-1',
        toOrgId: 'org-2',
        validationType: 'endorsement',
        content: 'Great org',
        validatorName: 'Test Person',
      },
      'http://localhost:3004/api/network/validate'
    );

    const res = await validatePOST(req);

    expect(res.status).not.toBe(401);
  });

  test('GET remains public (no auth required)', async () => {
    // Don't set up any user - GET should work without auth
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    const req = makeGetRequest('http://localhost:3004/api/network/validate?org_id=some-id');
    const res = await validateGET(req);

    // GET should succeed without auth
    expect(res.status).not.toBe(401);
  });
});
