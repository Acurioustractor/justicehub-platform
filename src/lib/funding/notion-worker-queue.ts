export interface QueueNotionSyncOptions {
  limit?: number;
  dryRun?: boolean;
  stageFilter?: string[];
  source?: string;
}

export interface QueueNotionSyncResult {
  scanned: number;
  queued: number;
  skipped: number;
  queuedOpportunityIds: string[];
}

export async function queueNotionSyncTasks(
  serviceClient: any,
  options: QueueNotionSyncOptions = {}
): Promise<QueueNotionSyncResult> {
  const limit = Math.max(1, Math.min(200, options.limit || 25));
  const dryRun = options.dryRun === true;
  const stageFilter = options.stageFilter || ['Matched', 'Matched - New', 'New'];
  const source = options.source || 'notion_worker';

  const { data: candidates, error: candidateError } = await serviceClient
    .from('notion_opportunities')
    .select('id, name, close_date, metadata, stage')
    .in('stage', stageFilter)
    .order('close_date', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (candidateError) {
    throw new Error(candidateError.message);
  }

  if (!candidates || candidates.length === 0) {
    return {
      scanned: 0,
      queued: 0,
      skipped: 0,
      queuedOpportunityIds: [],
    };
  }

  const candidateIds = candidates.map((c: any) => c.id);
  const { data: existingTasks, error: existingError } = await serviceClient
    .from('agent_task_queue')
    .select('source_id')
    .eq('source', source)
    .in('source_id', candidateIds)
    .in('status', ['queued', 'pending', 'running', 'in_progress']);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingIds = new Set((existingTasks || []).map((t: any) => t.source_id));
  const toQueue = candidates.filter((c: any) => !existingIds.has(c.id));

  const tasks = toQueue.map((item: any) => {
    const daysToClose = item.close_date
      ? Math.ceil((new Date(item.close_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    const priority =
      daysToClose !== null && daysToClose <= 7
        ? 1
        : daysToClose !== null && daysToClose <= 21
          ? 2
          : 3;
    const organizationId =
      item.metadata && typeof item.metadata === 'object'
        ? (item.metadata as Record<string, unknown>).organization_id
        : null;

    return {
      source,
      source_id: item.id,
      title: `Sync funding opportunity to Notion: ${item.name || 'Untitled'}`,
      description: `Opportunity ${item.id} for org ${organizationId || 'unknown'} queued for Notion sync worker.`,
      task_type: 'notion_sync',
      priority,
      status: 'queued',
      needs_review: false,
    };
  });

  if (!dryRun && tasks.length > 0) {
    const { error: insertError } = await serviceClient.from('agent_task_queue').insert(tasks);
    if (insertError) {
      throw new Error(insertError.message);
    }

    const queuedIds = toQueue.map((item: any) => item.id);
    if (queuedIds.length > 0) {
      await serviceClient
        .from('notion_opportunities')
        .update({
          stage: 'Queued',
          updated_at: new Date().toISOString(),
        })
        .in('id', queuedIds);
    }
  }

  return {
    scanned: candidates.length,
    queued: tasks.length,
    skipped: candidates.length - tasks.length,
    queuedOpportunityIds: toQueue.map((item: any) => item.id),
  };
}
