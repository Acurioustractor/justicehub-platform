export interface System0AuditEventInput {
  eventType: string;
  source: string;
  actorId?: string | null;
  runId?: string | null;
  message?: string | null;
  payload?: Record<string, unknown>;
}

export interface System0AuditEvent {
  id: string;
  eventType: string;
  source: string;
  actorId: string | null;
  runId: string | null;
  message: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

function mapEventRow(row: Record<string, unknown>): System0AuditEvent {
  return {
    id: String(row.id || ''),
    eventType: String(row.event_type || ''),
    source: String(row.source || ''),
    actorId: typeof row.actor_id === 'string' ? row.actor_id : null,
    runId: typeof row.run_id === 'string' ? row.run_id : null,
    message: typeof row.message === 'string' ? row.message : null,
    payload:
      row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
        ? (row.payload as Record<string, unknown>)
        : {},
    createdAt: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  };
}

export async function logSystem0Event(serviceClient: any, input: System0AuditEventInput): Promise<boolean> {
  try {
    const { error } = await serviceClient.from('funding_system0_events').insert([
      {
        event_type: input.eventType,
        source: input.source,
        actor_id: input.actorId || null,
        run_id: input.runId || null,
        message: input.message || null,
        payload: input.payload || {},
      },
    ]);
    if (error) {
      // Soft-fail to avoid interrupting operational flows.
      console.error('System 0 audit logging failed:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('System 0 audit logging exception:', error);
    return false;
  }
}

export async function listSystem0Events(
  serviceClient: any,
  options: {
    limit?: number;
    eventType?: string;
    source?: string;
    runId?: string;
    beforeCreatedAt?: string;
    fromCreatedAt?: string;
    toCreatedAt?: string;
  } = {}
): Promise<System0AuditEvent[]> {
  const limit = Math.max(1, Math.min(500, Number(options.limit || 30)));
  let query = serviceClient
    .from('funding_system0_events')
    .select('id, event_type, source, actor_id, run_id, message, payload, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (options.eventType) {
    query = query.eq('event_type', options.eventType);
  }
  if (options.source) {
    query = query.eq('source', options.source);
  }
  if (options.runId) {
    query = query.ilike('run_id', `%${options.runId}%`);
  }
  if (options.beforeCreatedAt) {
    query = query.lt('created_at', options.beforeCreatedAt);
  }
  if (options.fromCreatedAt) {
    query = query.gte('created_at', options.fromCreatedAt);
  }
  if (options.toCreatedAt) {
    query = query.lte('created_at', options.toCreatedAt);
  }

  const { data, error } = await query;
  if (error) {
    if (String(error.message || '').toLowerCase().includes('relation')) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data || []).map((row: Record<string, unknown>) => mapEventRow(row));
}
