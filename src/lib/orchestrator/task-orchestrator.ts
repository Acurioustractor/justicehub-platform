/**
 * Generic Task Orchestrator
 *
 * Generalizes System 0 beyond funding — any domain can enqueue
 * multi-step task pipelines that run in the background.
 *
 * Domains: research, enrichment, analysis, reporting, funding
 * Each task goes through: queued → running → completed/failed
 * Tasks can have dependencies (DAG ordering) and report back to a conversation.
 */

import { createServiceClient } from '@/lib/supabase/service-lite';

export type TaskDomain =
  | 'research'
  | 'enrichment'
  | 'analysis'
  | 'reporting'
  | 'funding'
  | 'discovery';

export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface TaskDefinition {
  title: string;
  description?: string;
  task_type: string;
  domain: TaskDomain;
  priority?: number; // 1 = highest
  depends_on?: string[];
  config?: Record<string, unknown>;
  conversation_id?: string;
  requested_by?: string;
}

export interface PipelineStep {
  task_type: string;
  title: string;
  description?: string;
  config?: Record<string, unknown>;
  priority?: number;
}

export interface PipelineDefinition {
  name: string;
  domain: TaskDomain;
  steps: PipelineStep[];
  conversation_id?: string;
  requested_by?: string;
}

const SOURCE_PREFIX = 'orchestrator';

function sourceFor(domain: TaskDomain): string {
  return `${SOURCE_PREFIX}_${domain}`;
}

/**
 * Enqueue a single task
 */
export async function enqueueTask(task: TaskDefinition): Promise<{ taskId: string }> {
  const supabase = createServiceClient();
  const taskId = crypto.randomUUID();

  const { error } = await supabase.from('agent_task_queue').insert({
    id: taskId,
    title: task.title,
    description: task.description || null,
    task_type: task.task_type,
    source: sourceFor(task.domain),
    source_id: `${taskId}:single`,
    status: 'queued',
    priority: task.priority || 5,
    depends_on: task.depends_on || [],
    conversation_id: task.conversation_id || null,
    requested_by: task.requested_by || null,
    reply_to: { config: task.config || {} },
    needs_review: false,
  });

  if (error) throw new Error(`Failed to enqueue task: ${error.message}`);
  return { taskId };
}

/**
 * Enqueue a multi-step pipeline with automatic dependency chaining
 */
export async function enqueuePipeline(pipeline: PipelineDefinition): Promise<{
  runId: string;
  taskIds: string[];
}> {
  const supabase = createServiceClient();
  const runId = crypto.randomUUID();
  const source = sourceFor(pipeline.domain);
  const taskIds: string[] = [];

  const tasks = pipeline.steps.map((step, index) => {
    const taskId = crypto.randomUUID();
    taskIds.push(taskId);

    return {
      id: taskId,
      title: `${pipeline.name}: ${step.title}`,
      description: step.description || null,
      task_type: step.task_type,
      source,
      source_id: `${runId}:${step.task_type}`,
      status: 'queued',
      priority: step.priority || index + 1,
      depends_on: index > 0 ? [taskIds[index - 1]] : [],
      conversation_id: pipeline.conversation_id || null,
      requested_by: pipeline.requested_by || null,
      reply_to: {
        run_id: runId,
        pipeline_name: pipeline.name,
        step_index: index,
        config: step.config || {},
      },
      needs_review: false,
    };
  });

  const { error } = await supabase.from('agent_task_queue').insert(tasks);
  if (error) throw new Error(`Failed to enqueue pipeline: ${error.message}`);

  return { runId, taskIds };
}

/**
 * Claim and execute the next available task for a domain
 */
export async function claimNextTask(domain?: TaskDomain): Promise<any | null> {
  const supabase = createServiceClient();

  let q = supabase
    .from('agent_task_queue')
    .select('*')
    .eq('status', 'queued')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(50);

  if (domain) {
    q = q.eq('source', sourceFor(domain));
  } else {
    q = q.like('source', `${SOURCE_PREFIX}_%`);
  }

  const { data: queuedTasks, error } = await q;
  if (error) throw new Error(error.message);
  if (!queuedTasks?.length) return null;

  for (const task of queuedTasks) {
    // Check dependencies
    const deps = Array.isArray(task.depends_on) ? task.depends_on : [];
    if (deps.length > 0) {
      const { data: depTasks } = await supabase
        .from('agent_task_queue')
        .select('id, status')
        .in('id', deps);
      if (!depTasks || depTasks.length !== deps.length) continue;
      if (!depTasks.every((d: any) => d.status === 'completed')) continue;
    }

    // Atomic claim
    const { data: claimed, error: claimError } = await supabase
      .from('agent_task_queue')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', task.id)
      .eq('status', 'queued')
      .select('*')
      .single();

    if (!claimError && claimed) return claimed;
  }

  return null;
}

/**
 * Complete a task with output
 */
export async function completeTask(
  taskId: string,
  output: Record<string, unknown>
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('agent_task_queue')
    .update({
      status: 'completed',
      output,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);
  if (error) throw new Error(error.message);
}

/**
 * Fail a task with error message
 */
export async function failTask(taskId: string, errorMessage: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('agent_task_queue')
    .update({
      status: 'failed',
      error: errorMessage,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      needs_review: true,
    })
    .eq('id', taskId);
  if (error) throw new Error(error.message);
}

/**
 * Get status of a task or pipeline run
 */
export async function getTaskStatus(taskOrRunId: string): Promise<{
  type: 'task' | 'pipeline';
  status: TaskStatus;
  tasks: Array<{
    id: string;
    title: string;
    task_type: string;
    status: string;
    output?: any;
    error?: string;
    started_at?: string;
    completed_at?: string;
  }>;
  summary: string;
}> {
  const supabase = createServiceClient();

  // Try as single task first
  const { data: singleTask } = await supabase
    .from('agent_task_queue')
    .select('id, title, task_type, status, output, error, started_at, completed_at')
    .eq('id', taskOrRunId)
    .single();

  if (singleTask) {
    return {
      type: 'task',
      status: singleTask.status as TaskStatus,
      tasks: [singleTask],
      summary: `${singleTask.title}: ${singleTask.status}${singleTask.error ? ` — ${singleTask.error}` : ''}`,
    };
  }

  // Try as pipeline run_id
  const { data: pipelineTasks } = await supabase
    .from('agent_task_queue')
    .select('id, title, task_type, status, output, error, started_at, completed_at')
    .like('source_id', `${taskOrRunId}:%`)
    .like('source', `${SOURCE_PREFIX}_%`)
    .order('priority', { ascending: true });

  if (!pipelineTasks?.length) {
    return {
      type: 'task',
      status: 'failed',
      tasks: [],
      summary: `No task or pipeline found with ID ${taskOrRunId}`,
    };
  }

  const completed = pipelineTasks.filter((t: any) => t.status === 'completed').length;
  const failed = pipelineTasks.filter((t: any) => t.status === 'failed').length;
  const running = pipelineTasks.filter((t: any) => t.status === 'running').length;
  const total = pipelineTasks.length;

  let overallStatus: TaskStatus = 'queued';
  if (failed > 0) overallStatus = 'failed';
  else if (completed === total) overallStatus = 'completed';
  else if (running > 0 || completed > 0) overallStatus = 'running';

  return {
    type: 'pipeline',
    status: overallStatus,
    tasks: pipelineTasks,
    summary: `Pipeline: ${completed}/${total} steps complete${failed ? `, ${failed} failed` : ''}${running ? `, ${running} running` : ''}`,
  };
}

/**
 * Get tasks linked to a conversation
 */
export async function getConversationTasks(conversationId: string): Promise<Array<{
  id: string;
  title: string;
  status: string;
  task_type: string;
  output?: any;
  created_at: string;
}>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('agent_task_queue')
    .select('id, title, status, task_type, output, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

// ─── Pre-built Pipeline Templates ─────────────────────────────────────────

/**
 * Research pipeline: search → analyze → summarize
 */
export function createResearchPipeline(opts: {
  query: string;
  conversation_id?: string;
  requested_by?: string;
}): PipelineDefinition {
  return {
    name: `Research: ${opts.query.slice(0, 60)}`,
    domain: 'research',
    conversation_id: opts.conversation_id,
    requested_by: opts.requested_by,
    steps: [
      {
        task_type: 'research_search',
        title: 'Search across all data sources',
        config: { query: opts.query },
      },
      {
        task_type: 'research_analyze',
        title: 'Analyze and cross-reference findings',
        config: { query: opts.query },
      },
      {
        task_type: 'research_summarize',
        title: 'Generate summary with citations',
        config: { query: opts.query },
      },
    ],
  };
}

/**
 * Org enrichment pipeline: lookup → enrich → link
 */
export function createEnrichmentPipeline(opts: {
  org_name: string;
  conversation_id?: string;
  requested_by?: string;
}): PipelineDefinition {
  return {
    name: `Enrich: ${opts.org_name.slice(0, 60)}`,
    domain: 'enrichment',
    conversation_id: opts.conversation_id,
    requested_by: opts.requested_by,
    steps: [
      {
        task_type: 'enrichment_lookup',
        title: 'Find org across ACNC, ORIC, GrantScope',
        config: { org_name: opts.org_name },
      },
      {
        task_type: 'enrichment_enrich',
        title: 'Pull financials, board, and programs',
        config: { org_name: opts.org_name },
      },
      {
        task_type: 'enrichment_link',
        title: 'Link funding records and entity graph',
        config: { org_name: opts.org_name },
      },
    ],
  };
}

/**
 * Analysis pipeline: gather → compute → report
 */
export function createAnalysisPipeline(opts: {
  question: string;
  scope?: string;
  conversation_id?: string;
  requested_by?: string;
}): PipelineDefinition {
  return {
    name: `Analysis: ${opts.question.slice(0, 60)}`,
    domain: 'analysis',
    conversation_id: opts.conversation_id,
    requested_by: opts.requested_by,
    steps: [
      {
        task_type: 'analysis_gather',
        title: 'Gather relevant data points',
        config: { question: opts.question, scope: opts.scope },
      },
      {
        task_type: 'analysis_compute',
        title: 'Run computations and comparisons',
        config: { question: opts.question },
      },
      {
        task_type: 'analysis_report',
        title: 'Generate analysis report',
        config: { question: opts.question },
      },
    ],
  };
}
