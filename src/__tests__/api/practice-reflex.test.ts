import { NextRequest } from 'next/server';

const mockGetUser = jest.fn();
const mockCheckOrgAccess = jest.fn();
const mockGetPracticeReflexState = jest.fn();
const mockRefreshPracticeReflexActions = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

jest.mock('@/lib/org-hub/auth', () => ({
  checkOrgAccess: (...args: any[]) => mockCheckOrgAccess(...args),
}));

jest.mock('@/lib/org-hub/practice-reflex', () => ({
  getPracticeReflexState: (...args: any[]) => mockGetPracticeReflexState(...args),
  refreshPracticeReflexActions: (...args: any[]) => mockRefreshPracticeReflexActions(...args),
}));

import { GET } from '@/app/api/org-hub/[orgId]/practice-reflex/route';
import { POST } from '@/app/api/org-hub/[orgId]/practice-reflex/pulse/route';

const params = { params: { orgId: 'org-1' } };

function request(method: 'GET' | 'POST') {
  return new NextRequest('http://localhost:3004/api/org-hub/org-1/practice-reflex', { method });
}

describe('Practice Reflex API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await GET(request('GET'), params);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Not authenticated');
    expect(mockCheckOrgAccess).not.toHaveBeenCalled();
    expect(mockGetPracticeReflexState).not.toHaveBeenCalled();
  });

  it('GET returns 403 for non-members', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockCheckOrgAccess.mockResolvedValue(false);

    const response = await GET(request('GET'), params);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe('Not authorized');
    expect(mockGetPracticeReflexState).not.toHaveBeenCalled();
  });

  it('GET returns aggregate state for org members', async () => {
    const state = { organization: { id: 'org-1' }, lanes: [], actions: [] };
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockCheckOrgAccess.mockResolvedValue(true);
    mockGetPracticeReflexState.mockResolvedValue(state);

    const response = await GET(request('GET'), params);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mockCheckOrgAccess).toHaveBeenCalledWith(expect.anything(), 'user-1', 'org-1');
    expect(mockGetPracticeReflexState).toHaveBeenCalledWith('org-1');
    expect(json.data).toEqual(state);
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await POST(request('POST'), params);

    expect(response.status).toBe(401);
    expect(mockRefreshPracticeReflexActions).not.toHaveBeenCalled();
  });

  it('POST returns 403 before writing for non-members', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockCheckOrgAccess.mockResolvedValue(false);

    const response = await POST(request('POST'), params);

    expect(response.status).toBe(403);
    expect(mockRefreshPracticeReflexActions).not.toHaveBeenCalled();
  });

  it('POST refreshes generated practice reflex actions for org members', async () => {
    const state = {
      actions: [
        { sourceAgent: 'practice_reflex' },
        { sourceAgent: 'practice_reflex' },
        { sourceAgent: 'pulse' },
      ],
    };
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockCheckOrgAccess.mockResolvedValue(true);
    mockRefreshPracticeReflexActions.mockResolvedValue(state);

    const response = await POST(request('POST'), params);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mockRefreshPracticeReflexActions).toHaveBeenCalledWith('org-1');
    expect(json.success).toBe(true);
    expect(json.generatedActions).toBe(2);
  });
});
