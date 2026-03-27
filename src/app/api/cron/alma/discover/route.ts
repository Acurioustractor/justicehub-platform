import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { LLMClient } from '@/lib/ai/model-router';
import { parseJSON } from '@/lib/ai/parse-json';
import {
  EvidenceDiscoveryResponseSchema,
  validateLLMOutput,
} from '@/lib/ai/llm-schemas';
import { searchWeb } from '@/lib/scraping/web-search';
import {
  getTodayRegion,
  buildRegionalSearchQueries,
  buildRegionalExtractionPrompt,
  RegionalDiscoverySchema,
} from '@/lib/cron/regional-discovery';

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

type DiscoveryMode = 'interventions' | 'orgs' | 'media' | 'regional';

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

  if (mode === 'regional') {
    return runRegionalDiscovery();
  }

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
    mode = (['interventions', 'orgs', 'media', 'regional'].includes(body.mode) ? body.mode : 'interventions') as DiscoveryMode;
  } catch {
    // use defaults
  }

  if (mode === 'regional') {
    return runRegionalDiscovery();
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
            : 'Case study';

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

// ---------------------------------------------------------------------------
// Regional Discovery Mode
// ---------------------------------------------------------------------------

async function runRegionalDiscovery() {
  const supabase = createServiceClient();
  const region = getTodayRegion();
  const queries = buildRegionalSearchQueries(region);

  const results = {
    mode: 'regional' as const,
    region: region.slug,
    region_state: region.state,
    searches_run: 0,
    programs_discovered: 0,
    orgs_discovered: 0,
    media_discovered: 0,
    duplicates_skipped: 0,
    errors: [] as string[],
  };

  try {
    // Collect search results from all 3 queries
    const allSearchResults: Array<{ title: string; url: string; description: string }> = [];

    for (const query of queries) {
      try {
        results.searches_run++;
        const hits = await searchWeb(query, 5);
        for (const hit of hits) {
          // Deduplicate by URL within this batch
          if (hit.url && !allSearchResults.some((r) => r.url === hit.url)) {
            allSearchResults.push(hit);
          }
        }
      } catch (err) {
        results.errors.push(
          `Search "${query.slice(0, 60)}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    if (allSearchResults.length === 0) {
      return NextResponse.json({
        success: true,
        results,
        message: 'No search results found for region',
        timestamp: new Date().toISOString(),
      });
    }

    // Call LLM to extract structured data
    const prompt = buildRegionalExtractionPrompt(region, allSearchResults);
    let extracted: ReturnType<typeof RegionalDiscoverySchema.parse> | null = null;

    try {
      const raw = await LLMClient.getBackgroundInstance().call(prompt, {
        maxTokens: 3000,
        jsonMode: true,
      });
      const parsed = parseJSON<unknown>(raw);
      const validated = RegionalDiscoverySchema.safeParse(parsed);
      if (!validated.success) {
        results.errors.push(
          `Schema validation: ${validated.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`
        );
      } else {
        extracted = validated.data;
      }
    } catch (err) {
      results.errors.push(
        `LLM extraction: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    if (!extracted) {
      return NextResponse.json({
        success: false,
        results,
        timestamp: new Date().toISOString(),
      });
    }

    // -----------------------------------------------------------------------
    // Insert programs as alma_interventions
    // -----------------------------------------------------------------------
    for (const program of extracted.programs) {
      try {
        if (!program.name || !program.source_url) continue;

        // Check if intervention already exists (unique on lower(name) + lower(org))
        const { data: existing } = await supabase
          .from('alma_interventions')
          .select('id')
          .ilike('name', program.name)
          .limit(1);

        if (existing && existing.length > 0) {
          results.duplicates_skipped++;
          continue;
        }

        // Look up org if mentioned
        let orgId: string | null = null;
        if (program.organization) {
          const { data: orgMatch } = await supabase
            .from('organizations')
            .select('id')
            .ilike('name', program.organization)
            .limit(1);
          if (orgMatch && orgMatch.length > 0) {
            orgId = orgMatch[0].id;
          }
        }

        const { error: insertErr } = await supabase
          .from('alma_interventions')
          .insert({
            name: program.name.substring(0, 300),
            type: program.type || 'Other',
            description: program.description || null,
            operating_organization: program.organization || null,
            operating_organization_id: orgId,
            evidence_level: 'Untested (theory/pilot stage)',
            verification_status: 'ai_discovered',
            source_urls: [program.source_url],
            metadata: {
              auto_discovered: true,
              discovery_method: 'cron_regional',
              discovery_region: region.slug,
              funding_source: program.funding_source || null,
              funding_amount: program.amount || null,
              evidence_notes: program.evidence_notes || null,
            },
          });

        if (insertErr) {
          // Likely unique constraint — skip silently
          if (insertErr.code === '23505') {
            results.duplicates_skipped++;
          } else {
            results.errors.push(`Insert program "${program.name}": ${insertErr.message}`);
          }
        } else {
          results.programs_discovered++;
        }
      } catch (err) {
        results.errors.push(
          `Program "${program.name}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    // -----------------------------------------------------------------------
    // Insert organisations
    // -----------------------------------------------------------------------
    for (const org of extracted.organizations) {
      try {
        if (!org.name) continue;

        const { data: existing } = await supabase
          .from('organizations')
          .select('id')
          .ilike('name', org.name)
          .limit(1);

        if (existing && existing.length > 0) {
          results.duplicates_skipped++;
          continue;
        }

        const { error: insertErr } = await supabase
          .from('organizations')
          .insert({
            name: org.name.substring(0, 300),
            state: region.state,
            is_indigenous_org: org.is_indigenous,
            description: org.description || null,
            metadata: {
              auto_discovered: true,
              discovery_method: 'cron_regional',
              discovery_region: region.slug,
              org_type: org.type,
              city: org.city || null,
            },
          });

        if (insertErr) {
          if (insertErr.code === '23505') {
            results.duplicates_skipped++;
          } else {
            results.errors.push(`Insert org "${org.name}": ${insertErr.message}`);
          }
        } else {
          results.orgs_discovered++;
        }
      } catch (err) {
        results.errors.push(
          `Org "${org.name}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    // -----------------------------------------------------------------------
    // Insert media articles
    // -----------------------------------------------------------------------
    for (const article of extracted.media_articles) {
      try {
        if (!article.headline || !article.url) continue;

        // Check if media article already exists by URL
        const { data: existing } = await supabase
          .from('alma_media_articles')
          .select('id')
          .eq('source_url', article.url)
          .limit(1);

        if (existing && existing.length > 0) {
          results.duplicates_skipped++;
          continue;
        }

        const { error: insertErr } = await supabase
          .from('alma_media_articles')
          .insert({
            headline: article.headline.substring(0, 500),
            source_url: article.url,
            publication: article.source || null,
            sentiment: article.sentiment || 'neutral',
            region: region.slug,
            metadata: {
              auto_discovered: true,
              discovery_method: 'cron_regional',
              discovery_region: region.slug,
              organizations_mentioned: article.organizations_mentioned || [],
              programs_mentioned: article.programs_mentioned || [],
            },
          });

        if (insertErr) {
          if (insertErr.code === '23505') {
            results.duplicates_skipped++;
          } else {
            results.errors.push(`Insert media "${article.headline.slice(0, 50)}": ${insertErr.message}`);
          }
        } else {
          results.media_discovered++;
        }
      } catch (err) {
        results.errors.push(
          `Media "${article.headline?.slice(0, 50)}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  } catch (err) {
    results.errors.push(
      `Regional discovery: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  console.log(
    `[Regional Discovery] ${region.slug} (${region.state}): ` +
    `${results.programs_discovered} programs, ${results.orgs_discovered} orgs, ` +
    `${results.media_discovered} media, ${results.duplicates_skipped} dupes, ` +
    `${results.errors.length} errors`
  );

  return NextResponse.json({
    success: results.errors.length === 0,
    results,
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
