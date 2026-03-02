export interface System0AuditFilterState {
  eventTypeFilter: string;
  eventSourceFilter: string;
  eventRunIdFilter: string;
  eventFromDate: string;
  eventToDate: string;
  eventsLimit: number;
}

export interface System0FilterPreset {
  id: string;
  name: string;
  filters: System0AuditFilterState;
  isShared: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertSystem0FilterPresetInput {
  id?: string;
  name: string;
  filters: Partial<System0AuditFilterState>;
  isShared?: boolean;
  userId?: string | null;
}

export interface DeleteSystem0FilterPresetResult {
  id: string;
  name: string;
  isShared: boolean;
  createdBy: string | null;
}

const DEFAULT_FILTERS: System0AuditFilterState = {
  eventTypeFilter: '',
  eventSourceFilter: '',
  eventRunIdFilter: '',
  eventFromDate: '',
  eventToDate: '',
  eventsLimit: 12,
};

function normalizeFilterState(input: Partial<System0AuditFilterState> = {}): System0AuditFilterState {
  const limit = Math.max(1, Math.min(100, Number(input.eventsLimit || DEFAULT_FILTERS.eventsLimit)));
  return {
    eventTypeFilter: typeof input.eventTypeFilter === 'string' ? input.eventTypeFilter : '',
    eventSourceFilter: typeof input.eventSourceFilter === 'string' ? input.eventSourceFilter : '',
    eventRunIdFilter: typeof input.eventRunIdFilter === 'string' ? input.eventRunIdFilter : '',
    eventFromDate: typeof input.eventFromDate === 'string' ? input.eventFromDate : '',
    eventToDate: typeof input.eventToDate === 'string' ? input.eventToDate : '',
    eventsLimit: limit,
  };
}

function mapPresetRow(row: Record<string, unknown>): System0FilterPreset {
  const rawFilters =
    row.filters && typeof row.filters === 'object' && !Array.isArray(row.filters)
      ? (row.filters as Partial<System0AuditFilterState>)
      : {};

  return {
    id: String(row.id || ''),
    name: String(row.name || ''),
    filters: normalizeFilterState(rawFilters),
    isShared: row.is_shared === false ? false : true,
    createdBy: typeof row.created_by === 'string' ? row.created_by : null,
    updatedBy: typeof row.updated_by === 'string' ? row.updated_by : null,
    createdAt: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : new Date().toISOString(),
  };
}

function normalizeUuid(value: string | null | undefined): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)) {
    return null;
  }
  return raw;
}

export async function listSystem0FilterPresets(
  serviceClient: any,
  options: {
    limit?: number;
    userId?: string | null;
    includeShared?: boolean;
    includePrivate?: boolean;
  } = {}
): Promise<System0FilterPreset[]> {
  const limit = Math.max(1, Math.min(100, Number(options.limit || 50)));
  const actorId = normalizeUuid(options.userId);
  const includeShared = options.includeShared !== false;
  const includePrivate = options.includePrivate !== false;

  let query = serviceClient
    .from('funding_system0_filter_presets')
    .select('id, name, filters, is_shared, created_by, updated_by, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (includeShared && includePrivate) {
    if (actorId) {
      query = query.or(`is_shared.eq.true,created_by.eq.${actorId}`);
    } else {
      query = query.eq('is_shared', true);
    }
  } else if (includeShared) {
    query = query.eq('is_shared', true);
  } else if (includePrivate) {
    if (!actorId) return [];
    query = query.eq('created_by', actorId);
  } else {
    return [];
  }

  const { data, error } = await query;

  if (error) {
    if (String(error.message || '').toLowerCase().includes('relation')) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data || []).map((row: Record<string, unknown>) => mapPresetRow(row));
}

export async function upsertSystem0FilterPreset(
  serviceClient: any,
  input: UpsertSystem0FilterPresetInput
): Promise<System0FilterPreset> {
  const actorId = normalizeUuid(input.userId);
  if (!actorId) {
    throw new Error('User id is required to save presets');
  }

  const name = String(input.name || '').trim();
  if (!name) {
    throw new Error('Preset name is required');
  }

  const id = input.id ? String(input.id).trim() : undefined;
  const isShared = input.isShared !== false;

  let existingRow: { id: string; is_shared: boolean; created_by: string | null } | null = null;

  if (id) {
    const { data, error: existingError } = await serviceClient
      .from('funding_system0_filter_presets')
      .select('id, is_shared, created_by')
      .eq('id', id)
      .maybeSingle();
    if (existingError) {
      throw new Error(existingError.message);
    }
    existingRow = data;
    if (
      data &&
      data.is_shared === false &&
      typeof data.created_by === 'string' &&
      data.created_by !== actorId
    ) {
      throw new Error('Cannot edit a private preset owned by another user');
    }
  }

  const payload = {
    name,
    filters: normalizeFilterState(input.filters || {}),
    is_shared: isShared,
    updated_by: actorId,
  };

  const insertPayload: Record<string, unknown> = {
    ...payload,
    created_by: actorId,
  };
  if (id) {
    insertPayload.id = id;
  }

  const query = existingRow
    ? serviceClient
      .from('funding_system0_filter_presets')
      .update(payload)
      .eq('id', existingRow.id)
    : serviceClient
      .from('funding_system0_filter_presets')
      .insert([insertPayload]);

  const { data, error } = await query
    .select('id, name, filters, is_shared, created_by, updated_by, created_at, updated_at')
    .single();

  if (error) throw new Error(error.message);
  return mapPresetRow(data as Record<string, unknown>);
}

export async function deleteSystem0FilterPreset(
  serviceClient: any,
  presetId: string,
  options: { userId?: string | null } = {}
): Promise<DeleteSystem0FilterPresetResult> {
  const actorId = normalizeUuid(options.userId);
  if (!actorId) {
    throw new Error('User id is required to delete presets');
  }

  const id = String(presetId || '').trim();
  if (!id) {
    throw new Error('Preset id is required');
  }

  const { data: existingRow, error: existingError } = await serviceClient
    .from('funding_system0_filter_presets')
    .select('id, name, is_shared, created_by')
    .eq('id', id)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (!existingRow) {
    throw new Error('Preset not found');
  }
  if (
    existingRow.is_shared === false &&
    typeof existingRow.created_by === 'string' &&
    existingRow.created_by !== actorId
  ) {
    throw new Error('Cannot delete a private preset owned by another user');
  }

  const { error } = await serviceClient
    .from('funding_system0_filter_presets')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  return {
    id,
    name: String(existingRow.name || ''),
    isShared: existingRow.is_shared === false ? false : true,
    createdBy: typeof existingRow.created_by === 'string' ? existingRow.created_by : null,
  };
}
