import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 100;

function toInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function dedupeSorted(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim())))).sort();
}

function intersectSets(left: Set<string>, right: Set<string>): Set<string> {
  const result = new Set<string>();
  for (const value of left) {
    if (right.has(value)) {
      result.add(value);
    }
  }
  return result;
}

function buildProvenance() {
  return {
    mode: 'authoritative' as const,
    summary:
      'Direct ALMA intervention reads with deterministic relation-table filtering and API-level pagination.',
    sources: [
      { table: 'alma_interventions', role: 'primary', classification: 'canonical' },
      { table: 'alma_intervention_outcomes', role: 'supporting', classification: 'canonical' },
      { table: 'alma_intervention_contexts', role: 'supporting', classification: 'canonical' },
      { table: 'alma_outcomes', role: 'supporting', classification: 'canonical' },
      { table: 'alma_community_contexts', role: 'supporting', classification: 'canonical' },
    ],
    generated_at: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get('search')?.trim() || '';
    const type = searchParams.get('type')?.trim() || '';
    const evidenceLevel = searchParams.get('evidence_level')?.trim() || '';
    const outcomeType = searchParams.get('outcome_type')?.trim() || '';
    const contextType = searchParams.get('context_type')?.trim() || '';

    const hasLegacyPagination = searchParams.has('limit') || searchParams.has('offset');
    const legacyLimit = Math.max(1, Math.min(MAX_PAGE_SIZE, toInt(searchParams.get('limit'), DEFAULT_PAGE_SIZE)));
    const legacyOffset = Math.max(0, toInt(searchParams.get('offset'), 0));

    const requestedPageSize = Math.max(
      1,
      Math.min(MAX_PAGE_SIZE, toInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE))
    );
    const requestedPage = Math.max(1, toInt(searchParams.get('page'), 1));

    const pageSize = hasLegacyPagination ? legacyLimit : requestedPageSize;
    const offset = hasLegacyPagination ? legacyOffset : (requestedPage - 1) * pageSize;
    const page = hasLegacyPagination ? Math.floor(offset / pageSize) + 1 : requestedPage;

    let filteredIds: Set<string> | null = null;

    if (outcomeType) {
      const { data: outcomeRows, error: outcomeError } = await supabase
        .from('alma_intervention_outcomes')
        .select('intervention_id, alma_outcomes!inner(outcome_type)')
        .eq('alma_outcomes.outcome_type', outcomeType);

      if (outcomeError) {
        throw new Error(outcomeError.message);
      }

      filteredIds = new Set(
        (outcomeRows || [])
          .map((row: any) => row.intervention_id as string | null)
          .filter((id: string | null): id is string => Boolean(id))
      );
    }

    if (contextType) {
      const { data: contextRows, error: contextError } = await supabase
        .from('alma_intervention_contexts')
        .select('intervention_id, alma_community_contexts!inner(context_type)')
        .eq('alma_community_contexts.context_type', contextType);

      if (contextError) {
        throw new Error(contextError.message);
      }

      const contextIds = new Set(
        (contextRows || [])
          .map((row: any) => row.intervention_id as string | null)
          .filter((id: string | null): id is string => Boolean(id))
      );

      filteredIds = filteredIds ? intersectSets(filteredIds, contextIds) : contextIds;
    }

    if (filteredIds && filteredIds.size === 0) {
      const [interventionFilterRows, outcomeFilterRows, contextFilterRows] = await Promise.all([
        supabase.from('alma_interventions').select('type, evidence_level'),
        supabase.from('alma_outcomes').select('outcome_type').not('outcome_type', 'is', null),
        supabase.from('alma_community_contexts').select('context_type').not('context_type', 'is', null),
      ]);

      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        total: 0,
        limit: pageSize,
        offset,
        page,
        pageSize,
        filters: {
          types: dedupeSorted((interventionFilterRows.data || []).map((row: any) => row.type)),
          evidenceLevels: dedupeSorted((interventionFilterRows.data || []).map((row: any) => row.evidence_level)),
          outcomeTypes: dedupeSorted((outcomeFilterRows.data || []).map((row: any) => row.outcome_type)),
          contextTypes: dedupeSorted((contextFilterRows.data || []).map((row: any) => row.context_type)),
        },
        provenance: buildProvenance(),
      });
    }

    let query = supabase
      .from('alma_interventions')
      .select('id, name, description, type, geography, evidence_level, consent_level, created_at', {
        count: 'exact',
      })
      .order('name', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (evidenceLevel) {
      query = query.eq('evidence_level', evidenceLevel);
    }

    if (filteredIds) {
      query = query.in('id', Array.from(filteredIds));
    }

    const [interventionsResult, interventionFilterRows, outcomeFilterRows, contextFilterRows] = await Promise.all([
      query,
      supabase.from('alma_interventions').select('type, evidence_level'),
      supabase.from('alma_outcomes').select('outcome_type').not('outcome_type', 'is', null),
      supabase.from('alma_community_contexts').select('context_type').not('context_type', 'is', null),
    ]);

    if (interventionsResult.error) {
      throw new Error(interventionsResult.error.message);
    }

    return NextResponse.json({
      success: true,
      data: interventionsResult.data || [],
      count: interventionsResult.count || 0,
      total: interventionsResult.count || 0,
      limit: pageSize,
      offset,
      page,
      pageSize,
      filters: {
        types: dedupeSorted((interventionFilterRows.data || []).map((row: any) => row.type)),
        evidenceLevels: dedupeSorted((interventionFilterRows.data || []).map((row: any) => row.evidence_level)),
        outcomeTypes: dedupeSorted((outcomeFilterRows.data || []).map((row: any) => row.outcome_type)),
        contextTypes: dedupeSorted((contextFilterRows.data || []).map((row: any) => row.context_type)),
      },
      provenance: buildProvenance(),
    });
  } catch (error: unknown) {
    console.error('Intelligence interventions API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch interventions',
      },
      { status: 500 }
    );
  }
}
