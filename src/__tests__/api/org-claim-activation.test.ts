import { NextRequest } from 'next/server';

const mockCheckAdmin = jest.fn();
const mockCreateServiceClient = jest.fn();
const mockFrom = jest.fn();
const mockMemberUpsert = jest.fn();
const mockOrganizationUpdate = jest.fn();

jest.mock('@/lib/supabase/admin-lite', () => ({
  checkAdmin: () => mockCheckAdmin(),
}));

jest.mock('@/lib/supabase/service-lite', () => ({
  createServiceClient: () => mockCreateServiceClient(),
}));

import { POST } from '@/app/api/admin/org-claims/activate/route';

function activationRequest() {
  return new NextRequest('http://localhost/api/admin/org-claims/activate', {
    method: 'POST',
    body: JSON.stringify({
      claim_id: 'claim-1',
      organization_id: 'org-1',
      user_id: 'user-1',
    }),
    headers: { 'content-type': 'application/json' },
  });
}

describe('Organization claim activation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockCheckAdmin.mockResolvedValue({ id: 'admin-1' });
    mockCreateServiceClient.mockReturnValue({ from: mockFrom });
    mockMemberUpsert.mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'organization_members') {
        return { upsert: mockMemberUpsert };
      }
      if (table === 'organizations') {
        return { update: mockOrganizationUpdate };
      }
      return {};
    });
  });

  it('falls back when trial_ends_at is missing instead of failing activation', async () => {
    mockOrganizationUpdate.mockImplementation((payload: Record<string, unknown>) => ({
      eq: jest.fn().mockResolvedValue(
        Object.prototype.hasOwnProperty.call(payload, 'trial_ends_at')
          ? {
              error: {
                code: '42703',
                message: 'column organizations.trial_ends_at does not exist',
              },
            }
          : { error: null }
      ),
    }));

    const response = await POST(activationRequest());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.trial_ends_at).toBeNull();
    expect(json.trial_warning).toContain('trial_ends_at column missing');
    expect(mockOrganizationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'organisation',
        billing_status: 'trialing',
        trial_ends_at: expect.any(String),
      })
    );
    expect(mockOrganizationUpdate).toHaveBeenCalledWith({
      plan: 'organisation',
      billing_status: 'trialing',
    });
  });
});
