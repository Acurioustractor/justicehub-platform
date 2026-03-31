import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';

/**
 * GET /api/intelligence/accountability
 *
 * Civic Accountability Cross-Reference Engine
 * Connects: What politicians SAID -> What they FUNDED -> What HAPPENED
 *
 * Query params:
 *   - q: search query (org name, program, or topic). Default: "youth justice"
 *   - jurisdiction: optional filter (QLD, NSW, FED, etc.)
 *
 * Returns unified accountability view across 5 data layers:
 *   1. said: civic_hansard speeches
 *   2. funded: justice_funding records
 *   3. happened: alma_interventions with evidence levels
 *   4. recommended: oversight_recommendations
 *   5. promised: civic_charter_commitments
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'youth justice';
  const jurisdiction = searchParams.get('jurisdiction');

  const supabase = createServiceClient();

  // Sanitize keyword for ilike patterns
  const keyword = query.replace(/[%_\\]/g, '');

  // 1. What they SAID
  let hansardQ = supabase
    .from('civic_hansard')
    .select('id, subject, speaker_name, speaker_party, sitting_date, jurisdiction, body_text')
    .or(`subject.ilike.%${keyword}%,body_text.ilike.%${keyword}%`)
    .order('sitting_date', { ascending: false })
    .limit(20);
  if (jurisdiction) hansardQ = hansardQ.eq('jurisdiction', jurisdiction);

  // 2. What they FUNDED
  const fundingQ = supabase
    .from('justice_funding')
    .select('id, program_name, amount_dollars, source, financial_year, alma_organization_id, state')
    .or(`program_name.ilike.%${keyword}%,source.ilike.%${keyword}%`)
    .order('amount_dollars', { ascending: false })
    .limit(20);

  // 3. What HAPPENED (programs + evidence)
  const programsQ = supabase
    .from('alma_interventions')
    .select('id, name, type, evidence_level, cost_per_young_person, operating_organization, geography')
    .neq('verification_status', 'ai_generated')
    .or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`)
    .limit(20);

  // 4. What oversight RECOMMENDED
  const oversightQ = supabase
    .from('oversight_recommendations')
    .select('id, oversight_body, recommendation_text, status, severity')
    .or(`recommendation_text.ilike.%${keyword}%,report_title.ilike.%${keyword}%`)
    .limit(10);

  // 5. What they PROMISED
  const promisesQ = supabase
    .from('civic_charter_commitments')
    .select('minister_name, commitment_text, status, status_evidence')
    .eq('youth_justice_relevant', true)
    .or(`commitment_text.ilike.%${keyword}%`)
    .limit(10);

  const [hansard, funding, programs, oversight, promises] = await Promise.all([
    hansardQ,
    fundingQ,
    programsQ,
    oversightQ,
    promisesQ,
  ]);

  // Build accountability summary
  const totalFunding = (funding.data || []).reduce(
    (sum: number, f: { amount_dollars: number | null }) => sum + (f.amount_dollars || 0),
    0
  );
  const speechCount = hansard.data?.length || 0;
  const programCount = programs.data?.length || 0;
  const rejectedRecs = (oversight.data || []).filter(
    (r: { status: string | null }) => r.status === 'rejected'
  ).length;
  const brokenPromises = (promises.data || []).filter(
    (p: { status: string | null }) => p.status === 'rejected' || p.status === 'not_started'
  ).length;

  return NextResponse.json({
    query,
    accountability: {
      said: {
        speeches: (hansard.data || []).map(
          (h: {
            speaker_name: string | null;
            speaker_party: string | null;
            sitting_date: string | null;
            jurisdiction: string | null;
            subject: string | null;
            body_text: string | null;
          }) => ({
            speaker: h.speaker_name,
            party: h.speaker_party,
            date: h.sitting_date,
            jurisdiction: h.jurisdiction,
            subject: h.subject,
            excerpt: h.body_text?.slice(0, 300),
          })
        ),
        count: speechCount,
      },
      funded: {
        records: (funding.data || []).map(
          (f: {
            program_name: string | null;
            amount_dollars: number | null;
            source: string | null;
            financial_year: string | null;
            state: string | null;
          }) => ({
            program: f.program_name,
            amount: f.amount_dollars,
            source: f.source,
            year: f.financial_year,
            state: f.state,
          })
        ),
        total: totalFunding,
        count: funding.data?.length || 0,
      },
      happened: {
        programs: (programs.data || []).map(
          (p: {
            name: string | null;
            type: string | null;
            evidence_level: string | null;
            cost_per_young_person: number | null;
            operating_organization: string | null;
          }) => ({
            name: p.name,
            type: p.type,
            evidence: p.evidence_level,
            cost: p.cost_per_young_person,
            org: p.operating_organization,
          })
        ),
        count: programCount,
      },
      recommended: {
        recommendations: oversight.data || [],
        rejected: rejectedRecs,
        count: oversight.data?.length || 0,
      },
      promised: {
        commitments: promises.data || [],
        broken: brokenPromises,
        count: promises.data?.length || 0,
      },
    },
    summary: {
      speeches_mentioning: speechCount,
      total_funding_matched: totalFunding,
      programs_found: programCount,
      recommendations_rejected: rejectedRecs,
      promises_broken: brokenPromises,
    },
    timestamp: new Date().toISOString(),
  });
}
