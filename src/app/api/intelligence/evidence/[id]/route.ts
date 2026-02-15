import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

function buildProvenance() {
  return {
    mode: 'authoritative' as const,
    summary: 'Evidence detail and relationship graph derived from canonical evidence/link tables.',
    sources: [
      { table: 'alma_evidence', role: 'primary', classification: 'canonical' },
      { table: 'alma_intervention_evidence', role: 'supporting', classification: 'canonical' },
      { table: 'article_related_evidence', role: 'supporting', classification: 'canonical' },
      { table: 'articles', role: 'supporting', classification: 'canonical' },
    ],
    generated_at: new Date().toISOString(),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const evidenceId = params.id;
    if (!evidenceId) {
      return NextResponse.json({ success: false, error: 'Evidence ID is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: evidence, error: evidenceError } = await supabase
      .from('alma_evidence')
      .select('*')
      .eq('id', evidenceId)
      .single();

    if (evidenceError) {
      if (evidenceError.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Evidence not found' }, { status: 404 });
      }
      throw new Error(evidenceError.message);
    }

    const [articlesData, interventionLinksData] = await Promise.all([
      supabase
        .from('article_related_evidence')
        .select(
          `
          relevance_note,
          articles:article_id (
            id,
            title,
            slug
          )
        `
        )
        .eq('evidence_id', evidenceId),
      supabase
        .from('alma_intervention_evidence')
        .select('intervention_id')
        .eq('evidence_id', evidenceId),
    ]);

    if (articlesData.error) throw new Error(articlesData.error.message);
    if (interventionLinksData.error) throw new Error(interventionLinksData.error.message);

    const interventionIds = Array.from(
      new Set(
        (interventionLinksData.data || [])
          .map((row: { intervention_id: string | null }) => row.intervention_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    let relatedEvidenceRows: any[] = [];
    if (interventionIds.length > 0) {
      const { data, error } = await supabase
        .from('alma_intervention_evidence')
        .select(
          `
          evidence_id,
          alma_evidence:evidence_id (
            id,
            title,
            source_url,
            metadata
          )
        `
        )
        .in('intervention_id', interventionIds)
        .neq('evidence_id', evidenceId)
        .limit(25);

      if (error) throw new Error(error.message);

      const dedupedEvidence = new Map<string, any>();
      for (const item of data || []) {
        const linkedEvidence = item.alma_evidence;
        if (!linkedEvidence) continue;
        if (!dedupedEvidence.has(linkedEvidence.id)) {
          dedupedEvidence.set(linkedEvidence.id, linkedEvidence);
        }
      }
      relatedEvidenceRows = Array.from(dedupedEvidence.values()).slice(0, 5);
    }

    const relatedContent = {
      articles:
        articlesData.data?.map((item: any) => ({
          ...item.articles,
          relevance_note: item.relevance_note,
        })) || [],
      evidence: relatedEvidenceRows.map((item: any) => ({
        id: item.id,
        title: item.title,
        source_title: item.metadata?.source_title || item.source_url || 'Source unavailable',
      })),
    };

    return NextResponse.json({
      success: true,
      evidence,
      relatedInterventionCount: interventionIds.length,
      relatedContent,
      provenance: buildProvenance(),
    });
  } catch (error: unknown) {
    console.error('Intelligence evidence detail API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch evidence detail',
      },
      { status: 500 }
    );
  }
}
