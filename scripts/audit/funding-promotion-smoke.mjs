import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { getFundingSmokeBaseUrl } from './lib/get-funding-smoke-base-url.mjs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const smokeSecret = String(process.env.FUNDING_SMOKE_SECRET || serviceRoleKey || '').trim();

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

if (!smokeSecret) {
  console.error('Missing FUNDING_SMOKE_SECRET or SUPABASE_SERVICE_ROLE_KEY for local smoke route auth');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }),
  },
});

function fail(message) {
  throw new Error(message);
}

async function getSeededRecommendation() {
  const { data: opportunity, error: opportunityError } = await supabase
    .from('alma_funding_opportunities')
    .select('id, name')
    .eq('scrape_source', 'funding_smoke_seed')
    .eq('source_id', 'funding-smoke-promotion-opportunity-1')
    .maybeSingle();

  if (opportunityError || !opportunity) {
    throw new Error(opportunityError?.message || 'Funding smoke opportunity not found');
  }

  const { data: recommendation, error: recommendationError } = await supabase
    .from('funding_match_recommendations')
    .select('id, opportunity_id, organization_id, recommendation_status')
    .eq('opportunity_id', opportunity.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recommendationError || !recommendation) {
    throw new Error(recommendationError?.message || 'Funding smoke recommendation not found');
  }

  return {
    opportunity,
    recommendation,
  };
}

async function verifyDownstreamState(recommendationId, expectedApplicationId, expectedAwardId) {
  const { data: recommendation, error: recommendationError } = await supabase
    .from('funding_match_recommendations')
    .select('id, opportunity_id, organization_id, recommendation_status')
    .eq('id', recommendationId)
    .maybeSingle();

  if (recommendationError || !recommendation) {
    throw new Error(recommendationError?.message || 'Failed to reload recommendation after promotion');
  }

  const { data: application, error: applicationError } = await supabase
    .from('alma_funding_applications')
    .select('id, status, opportunity_id, organization_id')
    .eq('id', expectedApplicationId)
    .maybeSingle();

  if (applicationError || !application) {
    throw new Error(applicationError?.message || 'Promoted application not found');
  }

  const { data: award, error: awardError } = await supabase
    .from('funding_awards')
    .select('id, award_status, opportunity_id, organization_id, application_id')
    .eq('id', expectedAwardId)
    .maybeSingle();

  if (awardError || !award) {
    throw new Error(awardError?.message || 'Promoted award not found');
  }

  if (recommendation.recommendation_status !== 'engaged') {
    fail(`Expected recommendation to be engaged, found ${recommendation.recommendation_status}`);
  }

  if (application.opportunity_id !== recommendation.opportunity_id) {
    fail('Promoted application opportunity_id does not match recommendation');
  }

  if (application.organization_id !== recommendation.organization_id) {
    fail('Promoted application organization_id does not match recommendation');
  }

  if (award.opportunity_id !== recommendation.opportunity_id) {
    fail('Promoted award opportunity_id does not match recommendation');
  }

  if (award.organization_id !== recommendation.organization_id) {
    fail('Promoted award organization_id does not match recommendation');
  }

  if (award.application_id !== application.id) {
    fail('Promoted award application_id does not match promoted application');
  }

  if (award.award_status !== 'recommended') {
    fail(`Expected promoted award_status to be recommended, found ${award.award_status}`);
  }

  if (application.status !== 'evaluating') {
    fail(`Expected promoted application status to be evaluating, found ${application.status}`);
  }

  return {
    recommendationStatus: recommendation.recommendation_status,
    applicationStatus: application.status,
    awardStatus: award.award_status,
  };
}

async function run() {
  const baseUrl = await getFundingSmokeBaseUrl();
  const { opportunity, recommendation } = await getSeededRecommendation();

  console.log(`Using base URL: ${baseUrl}`);
  console.log(`Using seeded opportunity: ${opportunity.name} (${opportunity.id})`);
  console.log(`Using seeded recommendation: ${recommendation.id}`);

  const response = await fetch(`${baseUrl}/api/dev/funding-smoke/promote-recommendation`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-funding-smoke-secret': smokeSecret,
    },
    body: JSON.stringify({
      recommendationId: recommendation.id,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (response.status !== 200 || payload?.success !== true) {
    throw new Error(
      payload?.error ||
        `Promotion smoke route failed with HTTP ${response.status}`
    );
  }

  if (!payload?.applicationId || !payload?.awardId) {
    fail('Promotion smoke route did not return applicationId and awardId');
  }

  const verification = await verifyDownstreamState(
    recommendation.id,
    payload.applicationId,
    payload.awardId
  );

  console.log('[PASS] funding promotion smoke');
  console.log(
    JSON.stringify(
      {
        recommendationId: recommendation.id,
        applicationId: payload.applicationId,
        awardId: payload.awardId,
        workflowId: payload.workflowId || null,
        verification,
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
