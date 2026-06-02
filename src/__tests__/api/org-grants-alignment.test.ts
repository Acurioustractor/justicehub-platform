import { NextRequest } from 'next/server';

const mockGetUser = jest.fn();
const mockCheckOrgAccess = jest.fn();
const mockCreateServiceClient = jest.fn();
const mockFrom = jest.fn();
const mockOrgGrantInsert = jest.fn();
const mockOrgDeadlineInsert = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => mockCreateServiceClient(),
}));

jest.mock('@/lib/org-hub/auth', () => ({
  checkOrgAccess: (...args: any[]) => mockCheckOrgAccess(...args),
}));

import { POST } from '@/app/api/org-hub/[orgId]/grants/route';

function grantRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/org-hub/org-1/grants', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('Org grants alignment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockCheckOrgAccess.mockResolvedValue(true);
    mockCreateServiceClient.mockReturnValue({ from: mockFrom });
    mockOrgGrantInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: 'grant-1', grant_name: 'Community grant' },
          error: null,
        }),
      }),
    });
    mockOrgDeadlineInsert.mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'org_grants') return { insert: mockOrgGrantInsert };
      if (table === 'org_deadlines') return { insert: mockOrgDeadlineInsert };
      return { insert: jest.fn() };
    });
  });

  it('writes managed grants to org_grants and acquittal deadlines to org_deadlines', async () => {
    const response = await POST(
      grantRequest({
        grant_name: 'Community grant',
        funder_name: 'Foundation',
        approved_amount: '50000',
        start_date: '2026-05-01',
        end_date: '2027-05-01',
        acquittal_due: '2027-06-01',
        reporting_frequency: 'quarterly',
        reporting_requirements: 'Quarterly story and budget report',
        status: 'active',
      }),
      { params: { orgId: 'org-1' } }
    );
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.data.id).toBe('grant-1');
    expect(mockFrom).toHaveBeenCalledWith('org_grants');
    expect(mockFrom).toHaveBeenCalledWith('org_deadlines');
    expect(mockFrom).not.toHaveBeenCalledWith('bgfit_grants');
    expect(mockFrom).not.toHaveBeenCalledWith('bgfit_deadlines');
    expect(mockOrgGrantInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        grant_name: 'Community grant',
        funder_name: 'Foundation',
        amount_awarded: 50000,
        approved_amount: 50000,
        contract_start: '2026-05-01',
        contract_end: '2027-05-01',
        acquittal_due_date: '2027-06-01',
        reporting_system: 'quarterly',
        status: 'active',
      })
    );
    expect(mockOrgDeadlineInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        grant_id: 'grant-1',
        deadline_type: 'acquittal',
        due_date: '2027-06-01',
        status: 'pending',
      })
    );
  });

  it('does not write grants for non-members', async () => {
    mockCheckOrgAccess.mockResolvedValue(false);

    const response = await POST(
      grantRequest({
        grant_name: 'Community grant',
        funder_name: 'Foundation',
        approved_amount: '50000',
      }),
      { params: { orgId: 'org-1' } }
    );

    expect(response.status).toBe(403);
    expect(mockCreateServiceClient).not.toHaveBeenCalled();
    expect(mockOrgGrantInsert).not.toHaveBeenCalled();
  });
});
