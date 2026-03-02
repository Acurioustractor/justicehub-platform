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

async function getPromotionRecommendationId() {
  const { data: opportunity, error: opportunityError } = await supabase
    .from('alma_funding_opportunities')
    .select('id')
    .eq('scrape_source', 'funding_smoke_seed')
    .eq('source_id', 'funding-smoke-promotion-opportunity-1')
    .maybeSingle();

  if (opportunityError || !opportunity) {
    throw new Error(opportunityError?.message || 'Promotion smoke opportunity not found');
  }

  const { data: recommendation, error: recommendationError } = await supabase
    .from('funding_match_recommendations')
    .select('id')
    .eq('opportunity_id', opportunity.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recommendationError || !recommendation) {
    throw new Error(recommendationError?.message || 'Promotion smoke recommendation not found');
  }

  return recommendation.id;
}

async function run() {
  const baseUrl = await getFundingSmokeBaseUrl();
  const recommendationId = await getPromotionRecommendationId();

  console.log(`Using base URL: ${baseUrl}`);
  console.log(`Using seeded recommendation: ${recommendationId}`);

  const response = await fetch(`${baseUrl}/api/dev/funding-smoke/relationship-pathway`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-funding-smoke-secret': smokeSecret,
    },
    body: JSON.stringify({
      recommendationId,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (response.status !== 200 || payload?.success !== true) {
    throw new Error(
      payload?.error ||
        `Relationship pathway smoke route failed with HTTP ${response.status}`
    );
  }

  const relationshipId = String(payload?.relationship?.relationshipId || '').trim();
  const pathwayTaskId = String(payload?.stage?.pathwayTaskId || '').trim();

  if (!relationshipId || !pathwayTaskId) {
    fail('Relationship pathway smoke route did not return relationship and pathway task IDs');
  }

  const { data: relationship, error: relationshipError } = await supabase
    .from('funding_relationship_engagements')
    .select('id, recommendation_id, relationship_status, current_stage_label, metadata')
    .eq('id', relationshipId)
    .maybeSingle();

  if (relationshipError || !relationship) {
    throw new Error(relationshipError?.message || 'Relationship record not found after smoke flow');
  }

  const metadata =
    relationship.metadata && typeof relationship.metadata === 'object'
      ? relationship.metadata
      : {};

  const stageKey = typeof metadata.stage_key === 'string' ? metadata.stage_key : null;
  const promotedApplicationId =
    typeof metadata.promoted_application_id === 'string'
      ? metadata.promoted_application_id
      : null;
  const promotedAwardId =
    typeof metadata.promoted_award_id === 'string' ? metadata.promoted_award_id : null;
  const pathwayTaskStatus =
    typeof metadata.pathway_task_status === 'string' ? metadata.pathway_task_status : null;

  if (relationship.recommendation_id !== recommendationId) {
    fail('Relationship record is linked to the wrong recommendation');
  }

  if (relationship.relationship_status !== 'active') {
    fail(`Expected relationship to remain active, found ${relationship.relationship_status}`);
  }

  if (!['application_live', 'award_recommended'].includes(String(stageKey || ''))) {
    fail(`Expected downstream checkpoint stage, found ${stageKey}`);
  }

  if (!promotedApplicationId || !promotedAwardId) {
    fail('Expected relationship metadata to include promoted application and award IDs');
  }

  if (pathwayTaskStatus !== 'completed') {
    fail(`Expected pathway task status completed in metadata, found ${pathwayTaskStatus}`);
  }

  const { data: pathwayTask, error: pathwayTaskError } = await supabase
    .from('agent_task_queue')
    .select('id, status')
    .eq('id', pathwayTaskId)
    .maybeSingle();

  if (pathwayTaskError || !pathwayTask) {
    throw new Error(pathwayTaskError?.message || 'Pathway task not found after smoke flow');
  }

  if (pathwayTask.status !== 'completed') {
    fail(`Expected stored pathway task to be completed, found ${pathwayTask.status}`);
  }

  console.log('[PASS] funding relationship pathway smoke');
  console.log(
    JSON.stringify(
      {
        recommendationId,
        relationshipId,
        pathwayTaskId,
        stageKey,
        promotedApplicationId,
        promotedAwardId,
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
