import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { getFundingSmokeBaseUrl } from './lib/get-funding-smoke-base-url.mjs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
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

async function getSeededCommitmentContext() {
  const { data: commitment, error: commitmentError } = await supabase
    .from('funding_outcome_commitments')
    .select('id')
    .eq('measurement_notes', 'Smoke seed commitment for accountability testing.')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (commitmentError || !commitment) {
    throw new Error(commitmentError?.message || 'Seeded smoke commitment not found');
  }

  const { data: update, error: updateError } = await supabase
    .from('funding_outcome_updates')
    .select('id')
    .eq('commitment_id', commitment.id)
    .order('reported_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (updateError || !update) {
    throw new Error(updateError?.message || 'Seeded smoke outcome update not found');
  }

  return {
    commitmentId: commitment.id,
    updateId: update.id,
  };
}

async function run() {
  const baseUrl = await getFundingSmokeBaseUrl();
  const { commitmentId, updateId } = await getSeededCommitmentContext();
  const timestamp = new Date().toISOString();
  const note = `Funding smoke validation ${timestamp}`;

  console.log(`Using base URL: ${baseUrl}`);
  console.log(`Using seeded commitment: ${commitmentId}`);
  console.log(`Using seeded update: ${updateId}`);

  const response = await fetch(
    `${baseUrl}/api/funding/accountability/commitments/${commitmentId}/contribute`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'validation',
        updateId,
        validatorKind: 'community_member',
        validationStatus: 'needs_follow_up',
        validatorName: 'Funding Smoke Public Contributor',
        validationNotes: note,
        impactRating: 3,
        trustRating: 2,
        contributorRole: 'Community participant',
        communityConnection: 'Smoke test validation submission',
        communityLocation: 'Local community',
        allowFollowUpContact: true,
        followUpContactPreference: 'Email is fine',
      }),
    }
  );

  const payload = await response.json().catch(() => null);

  if (response.status !== 200 || payload?.success !== true) {
    throw new Error(
      payload?.error || `Public contribution route failed with HTTP ${response.status}`
    );
  }

  if (payload?.mode !== 'validation' || payload?.reviewState !== 'community_submitted') {
    fail('Public contribution route returned an unexpected submission state');
  }

  if (!payload?.validationId) {
    fail('Public contribution route did not return validationId');
  }

  const { data: validation, error: validationError } = await supabase
    .from('community_outcome_validations')
    .select('id, update_id, validator_user_id, validation_status, validation_notes')
    .eq('id', payload.validationId)
    .maybeSingle();

  if (validationError || !validation) {
    throw new Error(validationError?.message || 'Created public validation was not found');
  }

  if (validation.update_id !== updateId) {
    fail('Created public validation is attached to the wrong update');
  }

  if (validation.validator_user_id !== null) {
    fail('Expected public validation to remain unauthenticated (validator_user_id should be null)');
  }

  if (validation.validation_status !== 'needs_follow_up') {
    fail(`Expected validation_status needs_follow_up, found ${validation.validation_status}`);
  }

  if (!String(validation.validation_notes || '').includes(note)) {
    fail('Created public validation note is missing the smoke marker');
  }

  if (!String(validation.validation_notes || '').includes('[Community context]')) {
    fail('Created public validation note is missing the community context block');
  }

  if (!String(validation.validation_notes || '').includes('Follow-up contact: Yes')) {
    fail('Created public validation note is missing the follow-up consent marker');
  }

  console.log('[PASS] funding public contribution smoke');
  console.log(
    JSON.stringify(
      {
        commitmentId,
        updateId,
        validationId: payload.validationId,
        workflowId: payload.workflowId || null,
        validationStatus: validation.validation_status,
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
