import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

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

function uniqueIds(rows) {
  return [...new Set((rows || []).map((row) => String(row.id || '').trim()).filter(Boolean))];
}

async function loadValidationRows(notePrefix) {
  const { data, error } = await supabase
    .from('community_outcome_validations')
    .select('id')
    .ilike('validation_notes', `%${notePrefix}%`)
    .limit(500);

  if (error) {
    throw new Error(error.message || `Failed to load validation rows for ${notePrefix}`);
  }

  return data || [];
}

async function loadWorkflowIds(validationId) {
  const { data, error } = await supabase
    .from('funding_agent_workflows')
    .select('id')
    .eq('workflow_type', 'community_submission_review')
    .contains('input_payload', {
      submissionKind: 'validation',
      submissionId: validationId,
    })
    .limit(50);

  if (error) {
    throw new Error(error.message || `Failed to load review workflows for validation ${validationId}`);
  }

  return uniqueIds(data || []);
}

async function deleteByIds(table, ids) {
  if (!ids.length) return 0;
  const { data, error } = await supabase.from(table).delete().in('id', ids).select('id');
  if (error) {
    throw new Error(error.message || `Failed to delete from ${table}`);
  }
  return Array.isArray(data) ? data.length : 0;
}

async function deletePublicEvidenceTasks(validationId) {
  let removed = 0;

  const localTaskIds = [];
  const contactTaskIds = [];

  const { data: localTasks, error: localTaskError } = await supabase
    .from('agent_task_queue')
    .select('id')
    .eq('source', 'funding_public_evidence')
    .contains('reply_to', {
      submissionKind: 'validation',
      submissionId: validationId,
    })
    .limit(50);

  if (localTaskError) {
    throw new Error(localTaskError.message || `Failed to load local evidence tasks for ${validationId}`);
  }

  localTaskIds.push(...uniqueIds(localTasks || []));

  const { data: contactTasks, error: contactTaskError } = await supabase
    .from('agent_task_queue')
    .select('id')
    .eq('source', 'funding_public_evidence_contact')
    .contains('reply_to', {
      submissionKind: 'validation',
      submissionId: validationId,
    })
    .limit(50);

  if (contactTaskError) {
    throw new Error(contactTaskError.message || `Failed to load contact tasks for ${validationId}`);
  }

  contactTaskIds.push(...uniqueIds(contactTasks || []));

  removed += await deleteByIds('agent_task_queue', [...localTaskIds, ...contactTaskIds]);

  const sourceIds = [
    `public-evidence:validation:${validationId}`,
    `public-evidence-risk:validation:${validationId}`,
  ];

  const { data: deletedOpsTasks, error: opsTaskError } = await supabase
    .from('agent_task_queue')
    .delete()
    .in('source_id', sourceIds)
    .select('id');

  if (opsTaskError) {
    throw new Error(opsTaskError.message || `Failed to delete operating tasks for ${validationId}`);
  }

  removed += Array.isArray(deletedOpsTasks) ? deletedOpsTasks.length : 0;
  return removed;
}

async function run() {
  const validationRows = [
    ...(await loadValidationRows('Funding smoke validation ')),
    ...(await loadValidationRows('Funding smoke moderation ')),
  ];

  const validationIds = uniqueIds(validationRows);

  if (!validationIds.length) {
    console.log(
      JSON.stringify(
        {
          removedValidations: 0,
          removedWorkflows: 0,
          removedTasks: 0,
          note: 'No transient public-evidence smoke artifacts found.',
        },
        null,
        2
      )
    );
    return;
  }

  let removedTasks = 0;
  let removedWorkflows = 0;

  for (const validationId of validationIds) {
    removedTasks += await deletePublicEvidenceTasks(validationId);
    const workflowIds = await loadWorkflowIds(validationId);
    removedWorkflows += await deleteByIds('funding_agent_workflows', workflowIds);
  }

  const removedValidations = await deleteByIds('community_outcome_validations', validationIds);

  console.log(
    JSON.stringify(
      {
        removedValidations,
        removedWorkflows,
        removedTasks,
        preservedSeedFixtures: true,
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
