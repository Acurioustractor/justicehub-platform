import { NextRequest } from 'next/server';

const mockCreateClient = jest.fn();
const mockGetUser = jest.fn();
const mockCheckOrgAccess = jest.fn();
const mockUpsertFundingDiscoveryReviewWorkspace = jest.fn();
const mockGetFundingApplicationDraftWorkspaceRecord = jest.fn();
const mockUpsertFundingApplicationDraftWorkspace = jest.fn();
const mockRequestFundingApplicationDraftCommunityReview = jest.fn();
const mockPromoteFundingApplicationDraftToLiveApplication = jest.fn();

jest.mock('@/lib/supabase/server-lite', () => ({
  createClient: (...args: any[]) => mockCreateClient(...args),
}));

jest.mock('@/lib/org-hub/auth', () => ({
  checkOrgAccess: (...args: any[]) => mockCheckOrgAccess(...args),
}));

jest.mock('@/lib/funding/funding-operating-system', () => ({
  fundingOsErrorResponse: (error: Error) => ({
    error: error.message || 'Funding workspace error',
    status: 500,
  }),
  getFundingApplicationDraftWorkspaceRecord: (...args: any[]) =>
    mockGetFundingApplicationDraftWorkspaceRecord(...args),
  upsertFundingDiscoveryReviewWorkspace: (...args: any[]) =>
    mockUpsertFundingDiscoveryReviewWorkspace(...args),
  upsertFundingApplicationDraftWorkspace: (...args: any[]) =>
    mockUpsertFundingApplicationDraftWorkspace(...args),
  requestFundingApplicationDraftCommunityReview: (...args: any[]) =>
    mockRequestFundingApplicationDraftCommunityReview(...args),
  promoteFundingApplicationDraftToLiveApplication: (...args: any[]) =>
    mockPromoteFundingApplicationDraftToLiveApplication(...args),
}));

import { POST as postBusinessSupport } from '@/app/api/funding/workspace/business-support/route';
import {
  GET as getApplicationDraft,
  POST as postApplicationDraft,
} from '@/app/api/funding/workspace/application-drafts/route';

function jsonRequest(url: string, body: Record<string, unknown>, method: 'GET' | 'POST' = 'POST') {
  return new NextRequest(url, {
    method,
    body: method === 'POST' ? JSON.stringify(body) : undefined,
    headers: method === 'POST' ? { 'content-type': 'application/json' } : undefined,
  });
}

describe('Funding workspace org access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: () => mockGetUser(),
      },
    });
  });

  it('blocks business support writes when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await postBusinessSupport(
      jsonRequest('http://localhost/api/funding/workspace/business-support', {
        organizationId: 'org-1',
        note: 'Support note',
      })
    );

    expect(response.status).toBe(401);
    expect(mockCheckOrgAccess).not.toHaveBeenCalled();
    expect(mockUpsertFundingDiscoveryReviewWorkspace).not.toHaveBeenCalled();
  });

  it('blocks business support writes for non-members before service writes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockCheckOrgAccess.mockResolvedValue(false);

    const response = await postBusinessSupport(
      jsonRequest('http://localhost/api/funding/workspace/business-support', {
        organizationId: 'org-1',
        note: 'Support note',
      })
    );

    expect(response.status).toBe(403);
    expect(mockCheckOrgAccess).toHaveBeenCalledWith(expect.anything(), 'user-1', 'org-1');
    expect(mockUpsertFundingDiscoveryReviewWorkspace).not.toHaveBeenCalled();
  });

  it('passes the authenticated actor into business support writes for org members', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockCheckOrgAccess.mockResolvedValue(true);
    mockUpsertFundingDiscoveryReviewWorkspace.mockResolvedValue({ id: 'workspace-1' });

    const response = await postBusinessSupport(
      jsonRequest('http://localhost/api/funding/workspace/business-support', {
        organizationId: 'org-1',
        note: 'Support note',
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockUpsertFundingDiscoveryReviewWorkspace).toHaveBeenCalledWith(
      { organizationId: 'org-1', note: 'Support note', decisionTag: undefined },
      'user-1'
    );
  });

  it('blocks application draft reads for non-members', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockCheckOrgAccess.mockResolvedValue(false);

    const response = await getApplicationDraft(
      new NextRequest(
        'http://localhost/api/funding/workspace/application-drafts?organizationId=org-1&opportunityId=opp-1'
      )
    );

    expect(response.status).toBe(403);
    expect(mockGetFundingApplicationDraftWorkspaceRecord).not.toHaveBeenCalled();
  });

  it('blocks application draft writes for non-members before service writes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockCheckOrgAccess.mockResolvedValue(false);

    const response = await postApplicationDraft(
      jsonRequest('http://localhost/api/funding/workspace/application-drafts', {
        organizationId: 'org-1',
        opportunityId: 'opp-1',
        narrativeDraft: 'Draft',
      })
    );

    expect(response.status).toBe(403);
    expect(mockUpsertFundingApplicationDraftWorkspace).not.toHaveBeenCalled();
    expect(mockRequestFundingApplicationDraftCommunityReview).not.toHaveBeenCalled();
    expect(mockPromoteFundingApplicationDraftToLiveApplication).not.toHaveBeenCalled();
  });
});
