import dotenv from 'dotenv';
import { getFundingSmokeBaseUrl } from './lib/get-funding-smoke-base-url.mjs';

dotenv.config({ path: '.env.local' });

const SEEDED_ORGANIZATION_ID = '11111111-1111-1111-1111-111111111004';
const SEEDED_OPPORTUNITY_ID = '61d44ffc-26df-41b3-9b27-7e385e2f013c';
const smokeSecret = String(
  process.env.FUNDING_SMOKE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
).trim();

function fail(message) {
  throw new Error(message);
}

async function run() {
  if (!smokeSecret) {
    fail('Missing FUNDING_SMOKE_SECRET or SUPABASE_SERVICE_ROLE_KEY for draft review smoke');
  }

  const baseUrl = await getFundingSmokeBaseUrl();
  console.log(`Using base URL: ${baseUrl}`);

  const response = await fetch(`${baseUrl}/api/funding/workspace/application-drafts`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      organizationId: SEEDED_ORGANIZATION_ID,
      opportunityId: SEEDED_OPPORTUNITY_ID,
      narrativeDraft: 'Smoke test application draft narrative.',
      supportMaterial: ['Letter of support from local partner'],
      communityReviewNotes: ['Please confirm the lived-experience framing before submission.'],
      budgetNotes: 'Stage the first allocation over the first 90 days.',
      requestCommunityReview: true,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success !== true) {
    fail(payload?.error || `Application draft smoke failed with HTTP ${response.status}`);
  }

  const draft = payload?.draft;
  const reviewTask = payload?.reviewTask;

  if (!draft || String(draft.draftStatus) !== 'in_review') {
    fail('Application draft smoke did not persist the draft in in_review status');
  }

  if (
    !reviewTask ||
    typeof reviewTask.id !== 'string' ||
    String(reviewTask.status || '') !== 'queued'
  ) {
    fail('Application draft smoke did not create a queued community review task');
  }

  const publicReviewGetResponse = await fetch(
    `${baseUrl}/api/funding/application-draft-reviews/${reviewTask.id}`,
    {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    }
  );
  const publicReviewGetPayload = await publicReviewGetResponse.json().catch(() => null);
  if (publicReviewGetResponse.status !== 200 || publicReviewGetPayload?.success !== true) {
    fail(
      publicReviewGetPayload?.error ||
        `Public draft review fetch failed with HTTP ${publicReviewGetResponse.status}`
    );
  }

  const publicReviewPostResponse = await fetch(
    `${baseUrl}/api/funding/application-draft-reviews/${reviewTask.id}`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        reviewerName: 'Smoke Community Reviewer',
        reviewerConnection: 'Local partner',
        recommendation: 'request_changes',
        note: 'Please tighten the community outcomes framing before submission.',
      }),
    }
  );
  const publicReviewPostPayload = await publicReviewPostResponse.json().catch(() => null);
  if (publicReviewPostResponse.status !== 200 || publicReviewPostPayload?.success !== true) {
    fail(
      publicReviewPostPayload?.error ||
        `Public draft review submission failed with HTTP ${publicReviewPostResponse.status}`
    );
  }

  const secondPublicReviewPostResponse = await fetch(
    `${baseUrl}/api/funding/application-draft-reviews/${reviewTask.id}`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        reviewerName: 'Second Smoke Reviewer',
        reviewerConnection: 'Program supporter',
        recommendation: 'endorse',
        note: 'This now reads strongly enough to move forward after edits.',
      }),
    }
  );
  const secondPublicReviewPostPayload = await secondPublicReviewPostResponse
    .json()
    .catch(() => null);
  if (
    secondPublicReviewPostResponse.status !== 200 ||
    secondPublicReviewPostPayload?.success !== true
  ) {
    fail(
      secondPublicReviewPostPayload?.error ||
        `Second public draft review submission failed with HTTP ${secondPublicReviewPostResponse.status}`
    );
  }

  const sessionResponse = await fetch(`${baseUrl}/api/dev/funding-smoke/admin-session`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-funding-smoke-secret': smokeSecret,
    },
  });
  const sessionPayload = await sessionResponse.json().catch(() => null);
  if (sessionResponse.status !== 200 || sessionPayload?.success !== true) {
    fail(sessionPayload?.error || `Admin session route failed with HTTP ${sessionResponse.status}`);
  }

  const setCookieHeader = sessionResponse.headers.get('set-cookie');
  const cookieHeader = String(setCookieHeader || '').split(';')[0].trim();
  if (!cookieHeader) {
    fail('Admin session route did not return a session cookie');
  }

  const listResponse = await fetch(
    `${baseUrl}/api/admin/funding/os/application-draft-reviews?status=all&limit=10`,
    {
      method: 'GET',
      headers: {
        accept: 'application/json',
        cookie: cookieHeader,
      },
    }
  );
  const listPayload = await listResponse.json().catch(() => null);
  if (listResponse.status !== 200 || !Array.isArray(listPayload?.data)) {
    fail(listPayload?.error || `Draft review list failed with HTTP ${listResponse.status}`);
  }

  const matchingTask = listPayload.data.find((task) => task.id === reviewTask.id);
  if (!matchingTask) {
    fail('Draft review task did not appear in the admin review queue');
  }
  if (
    String(matchingTask.communityReviewerRecommendation || '') !== 'endorse' ||
    !String(matchingTask.communityReviewerNote || '').includes(
      'reads strongly enough to move forward'
    )
  ) {
    fail('Latest public community reviewer input did not appear in the admin review queue');
  }
  if (Number(matchingTask.communityReviewerResponseCount || 0) < 2) {
    fail('Multiple public community reviewer responses were not preserved on the review task');
  }

  const resolveResponse = await fetch(
    `${baseUrl}/api/admin/funding/os/application-draft-reviews/resolve`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        cookie: cookieHeader,
      },
      body: JSON.stringify({
        taskId: reviewTask.id,
        resolution: 'needs_revision',
        note: 'Smoke review requested one more pass on the shared narrative.',
      }),
    }
  );
  const resolvePayload = await resolveResponse.json().catch(() => null);
  if (resolveResponse.status !== 200 || resolvePayload?.success !== true) {
    fail(resolvePayload?.error || `Draft review resolve failed with HTTP ${resolveResponse.status}`);
  }

  const resolvedTask = resolvePayload?.data;
  if (
    !resolvedTask ||
    String(resolvedTask.status || '') !== 'completed' ||
    String(resolvedTask.reviewDecision || '') !== 'resolved'
  ) {
    fail('Resolved draft review did not complete the review task');
  }

  const draftGetResponse = await fetch(
    `${baseUrl}/api/funding/workspace/application-drafts?organizationId=${SEEDED_ORGANIZATION_ID}&opportunityId=${SEEDED_OPPORTUNITY_ID}`,
    {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    }
  );
  const draftGetPayload = await draftGetResponse.json().catch(() => null);
  const resolvedDraft = draftGetPayload?.draft;
  if (draftGetResponse.status !== 200 || !resolvedDraft) {
    fail(
      draftGetPayload?.error ||
        `Draft fetch after review resolve failed with HTTP ${draftGetResponse.status}`
    );
  }
  if (String(resolvedDraft.draftStatus || '') !== 'draft') {
    fail('Resolved draft review did not return the draft to draft status');
  }

  const readyResponse = await fetch(`${baseUrl}/api/funding/workspace/application-drafts`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      organizationId: SEEDED_ORGANIZATION_ID,
      opportunityId: SEEDED_OPPORTUNITY_ID,
      narrativeDraft: 'Smoke test application draft narrative.',
      supportMaterial: ['Letter of support from local partner'],
      communityReviewNotes: ['Review feedback incorporated and ready for live application.'],
      budgetNotes: 'Stage the first allocation over the first 90 days.',
      draftStatus: 'ready_to_submit',
    }),
  });
  const readyPayload = await readyResponse.json().catch(() => null);
  if (readyResponse.status !== 200 || readyPayload?.success !== true) {
    fail(readyPayload?.error || `Ready-to-submit save failed with HTTP ${readyResponse.status}`);
  }

  const promoteResponse = await fetch(`${baseUrl}/api/funding/workspace/application-drafts`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      organizationId: SEEDED_ORGANIZATION_ID,
      opportunityId: SEEDED_OPPORTUNITY_ID,
      narrativeDraft: 'Smoke test application draft narrative.',
      supportMaterial: ['Letter of support from local partner'],
      communityReviewNotes: ['Review feedback incorporated and ready for live application.'],
      budgetNotes: 'Stage the first allocation over the first 90 days.',
      draftStatus: 'ready_to_submit',
      promoteToLiveApplication: true,
    }),
  });
  const promotePayload = await promoteResponse.json().catch(() => null);
  if (promoteResponse.status !== 200 || promotePayload?.success !== true) {
    fail(promotePayload?.error || `Draft promotion failed with HTTP ${promoteResponse.status}`);
  }

  const promotedDraft = promotePayload?.draft;
  if (!promotedDraft || String(promotedDraft.draftStatus || '') !== 'submitted') {
    fail('Draft promotion did not move the draft into submitted status');
  }
  if (!String(promotePayload?.applicationId || '').trim()) {
    fail('Draft promotion did not return a live application id');
  }

  console.log('[PASS] funding application draft smoke');
  console.log(
    JSON.stringify(
      {
        organizationId: SEEDED_ORGANIZATION_ID,
        opportunityId: SEEDED_OPPORTUNITY_ID,
        draftId: draft.id,
        initialDraftStatus: draft.draftStatus,
        reviewTaskId: reviewTask.id,
        initialReviewTaskStatus: reviewTask.status,
        communityReviewerRecommendation: matchingTask.communityReviewerRecommendation || null,
        communityReviewerResponseCount: matchingTask.communityReviewerResponseCount || 0,
        resolvedDraftStatus: resolvedDraft.draftStatus,
        resolvedReviewTaskStatus: resolvedTask.status,
        resolvedReviewDecision: resolvedTask.reviewDecision,
        promotedDraftStatus: promotedDraft.draftStatus,
        promotedApplicationId: promotePayload.applicationId,
        promotedAwardId: promotePayload.awardId || null,
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(`[FAIL] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
