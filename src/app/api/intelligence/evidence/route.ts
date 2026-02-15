import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

function toInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function dedupeSorted(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim())))).sort();
}

function buildProvenance() {
  return {
    mode: 'authoritative' as const,
    summary: 'Direct evidence library reads with deterministic filtering and pagination.',
    sources: [{ table: 'alma_evidence', role: 'primary', classification: 'canonical' }],
    generated_at: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get('search')?.trim() || '';
    const type = searchParams.get('type')?.trim() || '';

    const limit = Math.max(1, Math.min(MAX_LIMIT, toInt(searchParams.get('limit'), DEFAULT_LIMIT)));
    const page = Math.max(1, toInt(searchParams.get('page'), 1));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('alma_evidence')
      .select(
        'id, title, evidence_type, methodology, findings, author, organization, publication_date, source_url, consent_level',
        { count: 'exact' }
      )
      .order('publication_date', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`title.ilike.%${search}%,findings.ilike.%${search}%,author.ilike.%${search}%`);
    }

    if (type) {
      query = query.eq('evidence_type', type);
    }

    const [{ data, error, count }, typeOptionsResult] = await Promise.all([
      query,
      supabase.from('alma_evidence').select('evidence_type').not('evidence_type', 'is', null),
    ]);

    if (error) {
      throw new Error(error.message);
    }

    if (typeOptionsResult.error) {
      throw new Error(typeOptionsResult.error.message);
    }

    const types = dedupeSorted((typeOptionsResult.data || []).map((row: any) => row.evidence_type));

    return NextResponse.json({
      success: true,
      evidence: data || [],
      totalCount: count || 0,
      pagination: {
        page,
        limit,
        totalPages: Math.max(1, Math.ceil((count || 0) / limit)),
      },
      filters: {
        types,
      },
      provenance: buildProvenance(),
    });
  } catch (error: unknown) {
    console.error('Intelligence evidence API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch evidence',
      },
      { status: 500 }
    );
  }
}
