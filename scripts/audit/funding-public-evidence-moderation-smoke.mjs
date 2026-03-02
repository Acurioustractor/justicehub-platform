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
  const marker = `Funding smoke moderation ${new Date().toISOString()}`;

  console.log(`Using base URL: ${baseUrl}`);
  console.log(`Using seeded commitment: ${commitmentId}`);
  console.log(`Using seeded update: ${updateId}`);

  const submitResponse = await fetch(
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
        validatorName: 'Funding Smoke Moderation Contributor',
        validationNotes: marker,
        impactRating: 2,
        trustRating: 2,
        contributorRole: 'Community observer',
        communityConnection: 'Smoke test moderation path',
        communityLocation: 'Local community',
        allowFollowUpContact: true,
        followUpContactPreference: 'Email is fine',
      }),
    }
  );

  const submitPayload = await submitResponse.json().catch(() => null);

  if (submitResponse.status !== 200 || submitPayload?.success !== true) {
    throw new Error(
      submitPayload?.error ||
        `Public contribution route failed with HTTP ${submitResponse.status}`
    );
  }

  const validationId = String(submitPayload?.validationId || '').trim();
  if (!validationId) {
    fail('Public contribution route did not return validationId for moderation smoke');
  }

  const moderationResponse = await fetch(
    `${baseUrl}/api/dev/funding-smoke/public-evidence-moderation`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-funding-smoke-secret': smokeSecret,
      },
      body: JSON.stringify({
        kind: 'validation',
        submissionId: validationId,
      }),
    }
  );

  const moderationPayload = await moderationResponse.json().catch(() => null);

  if (moderationResponse.status !== 200 || moderationPayload?.success !== true) {
    throw new Error(
      moderationPayload?.error ||
        `Public evidence moderation smoke route failed with HTTP ${moderationResponse.status}`
    );
  }

  const localTaskId = String(moderationPayload?.localFollowUp?.taskId || '').trim();
  const opsTaskId = String(moderationPayload?.operatingFollowUp?.taskId || '').trim();

  if (!localTaskId || !opsTaskId) {
    fail('Moderation smoke route did not return both local and main follow-up task IDs');
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
    throw new Error(
      sessionPayload?.error ||
        `Admin session route failed with HTTP ${sessionResponse.status}`
    );
  }

  const setCookieHeader = sessionResponse.headers.get('set-cookie');
  const cookieHeader = String(setCookieHeader || '').split(';')[0].trim();
  if (!cookieHeader) {
    fail('Admin session route did not return a usable admin smoke cookie');
  }

  const outreachCreateResponse = await fetch(
    `${baseUrl}/api/admin/funding/os/public-submissions/contact-outreach`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        cookie: cookieHeader,
      },
      body: JSON.stringify({
        kind: 'validation',
        submissionId: validationId,
      }),
    }
  );

  const outreachCreatePayload = await outreachCreateResponse.json().catch(() => null);
  if (outreachCreateResponse.status !== 200) {
    throw new Error(
      outreachCreatePayload?.error ||
        `Contact outreach route failed with HTTP ${outreachCreateResponse.status}`
    );
  }

  const outreachTaskId = String(outreachCreatePayload?.taskId || '').trim();
  if (!outreachTaskId) {
    fail('Contact outreach route did not return a taskId');
  }

  const outreachCompleteResponse = await fetch(
    `${baseUrl}/api/admin/funding/os/public-submissions/contact-outreach-status`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        cookie: cookieHeader,
      },
      body: JSON.stringify({
        taskId: outreachTaskId,
        status: 'completed',
      }),
    }
  );

  const outreachCompletePayload = await outreachCompleteResponse.json().catch(() => null);
  if (outreachCompleteResponse.status !== 200) {
    throw new Error(
      outreachCompletePayload?.error ||
        `Contact outreach completion failed with HTTP ${outreachCompleteResponse.status}`
    );
  }

  const { data: reviewWorkflows, error: workflowError } = await supabase
    .from('funding_agent_workflows')
    .select('id, workflow_type, input_payload')
    .eq('workflow_type', 'community_submission_review')
    .order('completed_at', { ascending: false })
    .limit(20);

  if (workflowError) {
    throw new Error(workflowError.message || 'Failed to verify review workflow');
  }

  const matchingWorkflow = (reviewWorkflows || []).find((row) => {
    const inputPayload =
      row.input_payload && typeof row.input_payload === 'object'
        ? row.input_payload
        : {};
    return (
      String(inputPayload.submissionKind || '').trim().toLowerCase() === 'validation' &&
      String(inputPayload.submissionId || '').trim() === validationId
    );
  });

  if (!matchingWorkflow) {
    fail('Expected a persisted community_submission_review workflow for the public validation');
  }

  const { data: localTask, error: localTaskError } = await supabase
    .from('agent_task_queue')
    .select('id, source, source_id, task_type, status')
    .eq('id', localTaskId)
    .maybeSingle();

  if (localTaskError || !localTask) {
    throw new Error(localTaskError?.message || 'Local public evidence follow-up task not found');
  }

  const { data: opsTask, error: opsTaskError } = await supabase
    .from('agent_task_queue')
    .select('id, source, source_id, task_type, status')
    .eq('id', opsTaskId)
    .maybeSingle();

  if (opsTaskError || !opsTask) {
    throw new Error(opsTaskError?.message || 'Main operating follow-up task not found');
  }

  if (localTask.source !== 'funding_public_evidence') {
    fail(`Expected local task source funding_public_evidence, found ${localTask.source}`);
  }

  if (localTask.task_type !== 'funding_public_evidence_followup') {
    fail(`Expected local task type funding_public_evidence_followup, found ${localTask.task_type}`);
  }

  if (opsTask.source !== 'funding_os_followup') {
    fail(`Expected main task source funding_os_followup, found ${opsTask.source}`);
  }

  if (opsTask.task_type !== 'funding_ops_followup') {
    fail(`Expected main task type funding_ops_followup, found ${opsTask.task_type}`);
  }

  if (String(opsTask.source_id || '') !== `public-evidence:validation:${validationId}`) {
    fail('Main operating task source_id does not match the expected public evidence key');
  }

  const { data: outreachTask, error: outreachTaskError } = await supabase
    .from('agent_task_queue')
    .select('id, source, source_id, task_type, status, reply_to')
    .eq('id', outreachTaskId)
    .maybeSingle();

  if (outreachTaskError || !outreachTask) {
    throw new Error(outreachTaskError?.message || 'Contact outreach task not found');
  }

  if (outreachTask.source !== 'funding_public_evidence_contact') {
    fail(`Expected outreach task source funding_public_evidence_contact, found ${outreachTask.source}`);
  }

  if (outreachTask.task_type !== 'funding_public_evidence_contact_outreach') {
    fail(
      `Expected outreach task type funding_public_evidence_contact_outreach, found ${outreachTask.task_type}`
    );
  }

  const outreachReplyTo =
    outreachTask.reply_to && typeof outreachTask.reply_to === 'object'
      ? outreachTask.reply_to
      : {};

  const routeConversationTaskId = String(outreachCompletePayload?.autoConversationTaskId || '').trim();
  const routeConversationError = String(outreachCompletePayload?.autoConversationError || '').trim();
  const conversationTaskId = String(outreachReplyTo.auto_conversation_task_id || '').trim();
  if (!conversationTaskId) {
    fail(
      routeConversationTaskId
        ? 'Completed contact outreach created a conversation task but did not persist the linkage back on the outreach task'
        : routeConversationError ||
            'Completed contact outreach did not create a tracked conversation task'
    );
  }

  const { data: conversationTask, error: conversationTaskError } = await supabase
    .from('agent_task_queue')
    .select('id, source, task_type, status')
    .eq('id', conversationTaskId)
    .maybeSingle();

  if (conversationTaskError || !conversationTask) {
    throw new Error(conversationTaskError?.message || 'Tracked conversation task not found');
  }

  if (conversationTask.source !== 'funding_conversation_request') {
    fail(
      `Expected conversation task source funding_conversation_request, found ${conversationTask.source}`
    );
  }

  if (conversationTask.task_type !== 'funding_conversation_request') {
    fail(
      `Expected conversation task type funding_conversation_request, found ${conversationTask.task_type}`
    );
  }

  console.log('[PASS] funding public evidence moderation smoke');
  console.log(
    JSON.stringify(
      {
        validationId,
        reviewWorkflowId: matchingWorkflow.id,
        localTaskId,
        localTaskStatus: localTask.status,
        outreachTaskId,
        outreachTaskStatus: outreachTask.status,
        conversationTaskId,
        conversationTaskStatus: conversationTask.status,
        opsTaskId,
        opsTaskStatus: opsTask.status,
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
