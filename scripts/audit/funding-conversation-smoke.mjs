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
  const responseMessage = `Funding smoke conversation reply ${new Date().toISOString()}`;

  console.log(`Using base URL: ${baseUrl}`);
  console.log(`Using seeded recommendation: ${recommendationId}`);

  const createResponse = await fetch(`${baseUrl}/api/dev/funding-smoke/create-conversation`, {
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

  const createPayload = await createResponse.json().catch(() => null);

  if (createResponse.status !== 200 || createPayload?.success !== true) {
    throw new Error(
      createPayload?.error ||
        `Conversation smoke route failed with HTTP ${createResponse.status}`
    );
  }

  const taskId = String(createPayload?.taskId || '').trim();
  if (!taskId) {
    fail('Conversation smoke route did not return taskId');
  }

  const replyResponse = await fetch(`${baseUrl}/api/funding/conversations/${taskId}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'conversation_response',
      responderName: 'Funding Smoke Community Partner',
      responderEmail: 'funding-smoke@example.org',
      responseKind: 'interested',
      responseMessage,
    }),
  });

  const replyPayload = await replyResponse.json().catch(() => null);

  if (replyResponse.status !== 200 || replyPayload?.success !== true) {
    throw new Error(
      replyPayload?.error ||
        `Conversation public reply failed with HTTP ${replyResponse.status}`
    );
  }

  const { data: task, error: taskError } = await supabase
    .from('agent_task_queue')
    .select('id, status, reply_to')
    .eq('id', taskId)
    .maybeSingle();

  if (taskError || !task) {
    throw new Error(taskError?.message || 'Conversation task not found after public reply');
  }

  const replyTo =
    task.reply_to && typeof task.reply_to === 'object'
      ? task.reply_to
      : {};
  const communityResponse =
    replyTo.community_response && typeof replyTo.community_response === 'object'
      ? replyTo.community_response
      : null;

  if (!communityResponse) {
    fail('Conversation task is missing the saved community response');
  }

  if (communityResponse.response_kind !== 'interested') {
    fail(`Expected response_kind interested, found ${communityResponse.response_kind}`);
  }

  if (communityResponse.response_message !== responseMessage) {
    fail('Conversation task saved a different response message than was submitted');
  }

  if (!['running', 'in_progress'].includes(String(task.status || '').trim().toLowerCase())) {
    fail(`Expected conversation task to be reopened into running work, found ${task.status}`);
  }

  console.log('[PASS] funding conversation smoke');
  console.log(
    JSON.stringify(
      {
        recommendationId,
        taskId,
        taskStatus: task.status,
        responseKind: communityResponse.response_kind,
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
