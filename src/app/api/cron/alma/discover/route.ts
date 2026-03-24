import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { LLMClient } from '@/lib/ai/model-router';
import { parseJSON } from '@/lib/ai/parse-json';
import {
  EvidenceDiscoveryResponseSchema,
  validateLLMOutput,
} from '@/lib/ai/llm-schemas';
import { searchWeb } from '@/lib/scraping/web-search';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min max for Vercel

const EVIDENCE_TYPES = [
  'Program evaluation',
  'Case study',
  'Policy analysis',
  'Community-led research',
  'Quasi-experimental',
  'RCT (Randomized Control Trial)',
  'Government report',
  'Media coverage',
] as const;

type DiscoveryMode = 'interventions' | 'orgs' | 'media';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

/**
 * ALMA Evidence Discovery Cron
 *
 * Autonomous scheduled discovery — searches the web for new evidence about
 * ALMA interventions and organisations, extracts structured data via LLM,
 * and inserts into alma_evidence + alma_intervention_evidence.
 *
 * GET /api/cron/alma/discover?batch=5&mode=interventions
 * POST /api/cron/alma/discover { batch: 5, mode: "orgs" }
 *
 * Modes:
 *   interventions — search by intervention name (default)
 *   orgs — search by organisation name
 *   media — search for media coverage of youth justice programs
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const batch = Math.min(10, Math.max(1, Number(request.nextUrl.searchParams.get('batch') || '5')));
  const mode = (request.nextUrl.searchParams.get('mode') || 'interventions') as DiscoveryMode;

  return runDiscovery(batch, mode);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let batch = 5;
  let mode: DiscoveryMode = 'interventions';
  try {
    const body = await request.json();
    batch = Math.min(10, Math.max(1, Number(body.batch || 5)));
    mode = (['interventions', 'orgs', 'media'].includes(body.mode) ? body.mode : 'interventions') as DiscoveryMode;
  } catch {
    // use defaults
  }

  return runDiscovery(batch, mode);
}

async function runDiscovery(batchSize: number, mode: DiscoveryMode) {
  const supabase = createServiceClient();
  const results = {
    mode,
    searched: 0,
    evidence_discovered: 0,
    evidence_links_created: 0,
    duplicates_skipped: 0,
    errors: [] as string[],
  };

  try {
    // Get existing evidence URLs to avoid duplicates
    const { data: existingEvidence } = await supabase
      .from('alma_evidence')
      .select('source_url');
    const existingUrls = new Set(
      (existingEvidence || []).map((e) => e.source_url).filter(Boolean)
    );

    // Get evidence counts per intervention
    const { data: evidenceCounts } = await supabase
      .from('alma_intervention_evidence')
      .select('intervention_id');
    const evCountMap: Record<string, number> = {};
    for (const link of evidenceCounts || []) {
      evCountMap[link.intervention_id] = (evCountMap[link.intervention_id] || 0) + 1;
    }

    // Get candidates based on mode
    let candidates: Array<{ id: string; name: string; type: string | null; org?: string | null; evidenceCount: number }> = [];

    if (mode === 'interventions' || mode === 'media') {
      const { data: interventions } = await supabase
        .from('alma_interventions')
        .select('id, name, type, operating_organization')
        .neq('verification_status', 'ai_generated')
        .order('updated_at', { ascending: false })
        .limit(300);

      candidates = (interventions || [])
        .map((i) => ({
          id: i.id,
          name: i.name,
          type: i.type,
          org: i.operating_organization,
          evidenceCount: evCountMap[i.id] || 0,
        }))
        .sort((a, b) => a.evidenceCount - b.evidenceCount)
        .slice(0, batchSize);
    } else if (mode === 'orgs') {
      // Search by organisation name — find interventions by orgs with fewest evidence links
      const { data: interventions } = await supabase
        .from('alma_interventions')
        .select('id, name, type, operating_organization')
        .neq('verification_status', 'ai_generated')
        .not('operating_organization', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(300);

      candidates = (interventions || [])
        .filter((i) => i.operating_organization)
        .map((i) => ({
          id: i.id,
          name: i.name,
          type: i.type,
          org: i.operating_organization,
          evidenceCount: evCountMap[i.id] || 0,
        }))
        .sort((a, b) => a.evidenceCount - b.evidenceCount)
        .slice(0, batchSize);
    }

    // Search and extract evidence for each candidate
    for (const candidate of candidates) {
      results.searched++;

      let query: string;
      if (mode === 'media') {
        query = `"${candidate.name.substring(0, 50)}" youth justice Australia news`;
      } else if (mode === 'orgs') {
        query = `"${(candidate.org || '').substring(0, 50)}" youth justice program evaluation outcomes Australia`;
      } else {
        query = `"${candidate.name.substring(0, 50)}" ${candidate.type || ''} evaluation outcomes Australia`;
      }

      try {
        const searchResults = await searchWeb(query);
        const newResults = searchResults.filter((r) => r.url && !existingUrls.has(r.url));

        if (newResults.length === 0) {
          results.duplicates_skipped++;
          continue;
        }

        const prompt = buildPrompt(newResults, candidate, mode);
        const raw = await LLMClient.getBackgroundInstance().call(prompt, { maxTokens: 2000 });
        const parsed = parseJSON<unknown>(raw);
        const validated = validateLLMOutput(parsed, EvidenceDiscoveryResponseSchema);
        if (!validated.success) {
          results.errors.push(
            `${candidate.name}: schema validation failed — ${validated.errors.slice(0, 3).join('; ')}`
          );
          continue;
        }

        for (const ev of validated.data.results) {
          if (!ev.url || !ev.title) continue;
          if ((ev.relevance_score || 0) < 0.4) continue;
          if (existingUrls.has(ev.url)) {
            results.duplicates_skipped++;
            continue;
          }

          const evidenceType = EVIDENCE_TYPES.includes(ev.evidence_type as typeof EVIDENCE_TYPES[number])
            ? ev.evidence_type
            : mode === 'media' ? 'Media coverage' : 'Case study';

          const { data: inserted } = await supabase
            .from('alma_evidence')
            .upsert({
              title: (ev.title || '').substring(0, 500),
              evidence_type: evidenceType,
              findings: ev.findings || ev.title,
              source_url: ev.url,
              methodology: ev.methodology || null,
              author: ev.author || null,
              publication_date: ev.year ? `${ev.year}-01-01` : null,
              consent_level: 'Public Knowledge Commons',
              metadata: {
                auto_discovered: true,
                discovery_method: 'cron_discover',
                discovery_mode: mode,
              } as const,
            }, { onConflict: 'source_url', ignoreDuplicates: true })
            .select('id')
            .single();

          if (inserted) {
            existingUrls.add(ev.url);
            results.evidence_discovered++;
            const { error: linkErr } = await supabase
              .from('alma_intervention_evidence')
              .insert({ intervention_id: candidate.id, evidence_id: inserted.id });
            if (!linkErr) results.evidence_links_created++;
          }
        }
      } catch (err) {
        results.errors.push(
          `${candidate.name}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  } catch (err) {
    results.errors.push(
      `Discovery: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Get updated counts
  const [{ count: totalEvidence }, { count: totalLinks }] = await Promise.all([
    supabase.from('alma_evidence').select('*', { count: 'exact', head: true }),
    supabase.from('alma_intervention_evidence').select('*', { count: 'exact', head: true }),
  ]);

  return NextResponse.json({
    success: results.errors.length === 0,
    results,
    totals: {
      evidence: totalEvidence || 0,
      evidence_links: totalLinks || 0,
    },
    timestamp: new Date().toISOString(),
  });
}

function buildPrompt(
  searchResults: Array<{ title?: string; url?: string; description?: string }>,
  intervention: { name: string; type: string | null; org?: string | null },
  mode: DiscoveryMode,
): string {
  const resultsText = searchResults
    .slice(0, 8)
    .map((r, i) => `${i + 1}. "${r.title}" — ${r.url}\n   ${r.description || ''}`)
    .join('\n');

  return `You are an Australian youth justice researcher. Evaluate these search results for evidence relevant to:

Intervention: ${intervention.name}
Type: ${intervention.type || 'Unknown'}
Organisation: ${intervention.org || 'Unknown'}
Search mode: ${mode}

Search results:
${resultsText}

For each RELEVANT result (relevance_score >= 0.4), extract:
- title: Document title
- evidence_type: One of: Program evaluation, Case study, Policy analysis, Community-led research, Quasi-experimental, RCT (Randomized Control Trial), Government report, Media coverage
- url: Source URL
- findings: Key findings (1-2 sentences)
- methodology: Research methodology if evident
- author: Author or publishing organization
- year: Publication year (number)
- relevance_score: 0.0-1.0 how relevant this is to the intervention

Return JSON: { "results": [...] }
Only include results that are genuinely about this intervention or closely related programs. Skip generic pages, directories, or unrelated content.`;
}
