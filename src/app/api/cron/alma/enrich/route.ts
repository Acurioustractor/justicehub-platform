import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { LLMClient } from '@/lib/ai/model-router';
import { parseJSON } from '@/lib/ai/parse-json';
import { searchWeb } from '@/lib/scraping/web-search';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

/**
 * ALMA Data Enrichment Agent
 *
 * Fills critical data gaps identified in sector analysis:
 * 1. Evidence metadata enrichment (outcome tags, methodology, recidivism data)
 * 2. Detention facility population data (from AIHW/ROGS reports)
 * 3. Intervention cost-per-young-person data
 * 4. ALMA research findings from academic sources
 *
 * Runs modes via ?mode= parameter:
 * - evidence_metadata (default) - enriches empty evidence metadata
 * - facility_data - updates detention facility population stats
 * - cost_data - discovers cost-per-person data for interventions
 * - research - discovers academic research findings
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') || 'evidence_metadata';
  const batch = Math.min(Math.max(parseInt(url.searchParams.get('batch') || '10'), 1), 30);

  const supabase = createServiceClient();
  const llm = LLMClient.getBackgroundInstance();

  try {
    switch (mode) {
      case 'evidence_metadata':
        return NextResponse.json(await enrichEvidenceMetadata(supabase, llm, batch));
      case 'cost_data':
        return NextResponse.json(await enrichCostData(supabase, llm, batch));
      case 'research':
        return NextResponse.json(await discoverResearch(supabase, llm, batch));
      default:
        return NextResponse.json({ error: `Unknown mode: ${mode}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[ALMA Enrich] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Phase 1: Enrich evidence metadata
 *
 * Evidence items have empty metadata {}. For each, read the source URL
 * and extract: outcome_type, methodology, sample_size, recidivism_impact,
 * geographic_scope, time_period, key_findings
 */
async function enrichEvidenceMetadata(
  supabase: ReturnType<typeof createServiceClient>,
  llm: LLMClient,
  batch: number
) {
  // Find evidence with empty metadata
  const { data: evidence } = await supabase
    .from('alma_evidence')
    .select('id, title, description, source_url, evidence_type, metadata')
    .eq('metadata', '{}')
    .not('description', 'is', null)
    .limit(batch);

  if (!evidence?.length) {
    return { mode: 'evidence_metadata', processed: 0, message: 'No evidence needing enrichment' };
  }

  let enriched = 0;
  let errors = 0;

  for (const item of evidence) {
    try {
      const prompt = `Analyze this youth justice evidence item and extract structured metadata.

Title: ${item.title || 'Untitled'}
Description: ${item.description || ''}
Evidence Type: ${item.evidence_type || 'Unknown'}
Source: ${item.source_url || 'No URL'}

Return a JSON object with these fields (use null for unknown):
{
  "outcome_types": ["list of outcome categories from: Reduced recidivism, Diversion from justice system, Cultural connection, Educational engagement, Mental health/wellbeing, Employment/training, Community safety, Reduced detention/incarceration, Family connection, Reduced substance use, System cost reduction"],
  "methodology": "qualitative|quantitative|mixed_methods|case_study|meta_analysis|program_evaluation|null",
  "sample_size": "number or description of participants/subjects, or null",
  "recidivism_impact": "description of impact on reoffending if mentioned, or null",
  "geographic_scope": "state/region/national, or null",
  "time_period": "study period or publication year, or null",
  "key_findings": "1-2 sentence summary of key findings",
  "indigenous_focus": true/false,
  "evidence_strength": "strong|moderate|emerging|anecdotal"
}`;

      const response = await llm.chat([{ role: 'user', content: prompt }]);
      const parsed = parseJSON(response);

      if (parsed && typeof parsed === 'object') {
        const { error } = await supabase
          .from('alma_evidence')
          .update({ metadata: parsed })
          .eq('id', item.id);

        if (!error) enriched++;
        else errors++;
      }
    } catch (err) {
      errors++;
      console.error(`[ALMA Enrich] Evidence ${item.id}:`, err);
    }
  }

  return {
    mode: 'evidence_metadata',
    candidates: evidence.length,
    enriched,
    errors,
    remaining: await countEmptyEvidence(supabase),
  };
}

async function countEmptyEvidence(supabase: ReturnType<typeof createServiceClient>) {
  const { count } = await supabase
    .from('alma_evidence')
    .select('*', { count: 'exact', head: true })
    .eq('metadata', '{}');
  return count || 0;
}

/**
 * Phase 2: Discover cost-per-young-person data
 *
 * Most interventions have null cost_per_young_person. Search for this data
 * in public sources and annual reports.
 */
async function enrichCostData(
  supabase: ReturnType<typeof createServiceClient>,
  llm: LLMClient,
  batch: number
) {
  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('id, name, type, operating_organization, description, implementation_cost')
    .neq('verification_status', 'ai_generated')
    .is('cost_per_young_person', null)
    .not('operating_organization', 'is', null)
    .limit(batch);

  if (!interventions?.length) {
    return { mode: 'cost_data', processed: 0, message: 'No interventions needing cost data' };
  }

  let enriched = 0;

  for (const item of interventions) {
    try {
      const query = `"${item.name}" OR "${item.operating_organization}" youth justice cost per participant annual report`;
      const results = await searchWeb(query);

      if (!results?.length) continue;

      const snippets = results.slice(0, 3).map((r) => `${r.title}: ${r.description}`).join('\n');

      const prompt = `From these search results, can you determine the cost per young person/participant for this program?

Program: ${item.name}
Organization: ${item.operating_organization}
Type: ${item.type}
Current cost info: ${item.implementation_cost || 'None'}

Search results:
${snippets}

Return JSON: { "cost_per_young_person": number_or_null, "cost_source": "url or description", "cost_notes": "context about the figure" }`;

      const response = await llm.chat([{ role: 'user', content: prompt }]);
      const parsed = parseJSON(response);

      if (parsed?.cost_per_young_person && typeof parsed.cost_per_young_person === 'number') {
        await supabase
          .from('alma_interventions')
          .update({
            cost_per_young_person: parsed.cost_per_young_person,
            implementation_cost: parsed.cost_notes || item.implementation_cost,
          })
          .eq('id', item.id);
        enriched++;
      }
    } catch (err) {
      console.error(`[ALMA Enrich] Cost ${item.id}:`, err);
    }
  }

  return { mode: 'cost_data', candidates: interventions.length, enriched };
}

/**
 * Phase 3: Discover academic research findings
 *
 * Search for peer-reviewed research on youth justice interventions
 * and add to alma_research_findings
 */
async function discoverResearch(
  supabase: ReturnType<typeof createServiceClient>,
  llm: LLMClient,
  batch: number
) {
  const searchTerms = [
    'Australian youth justice recidivism reduction evidence',
    'Indigenous youth diversion program outcomes Australia',
    'youth detention alternatives cost effectiveness',
    'community-based youth justice intervention evaluation',
    'Aboriginal Torres Strait Islander youth justice what works',
    'restorative justice youth outcomes meta-analysis',
    'youth justice reinvestment evaluation Australia',
    'therapeutic youth justice programs evidence base',
  ];

  // Pick a random search term
  const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  const results = await searchWeb(term);

  if (!results?.length) {
    return { mode: 'research', searched: term, found: 0 };
  }

  let inserted = 0;
  let duplicates = 0;

  for (const result of results.slice(0, batch)) {
    try {
      // Check for duplicate by matching title in validation_source
      const { count } = await supabase
        .from('alma_research_findings')
        .select('*', { count: 'exact', head: true })
        .eq('validation_source', result.title);

      if ((count || 0) > 0) {
        duplicates++;
        continue;
      }

      const prompt = `Analyze this search result about youth justice research. Extract structured data.

Title: ${result.title}
URL: ${result.url}
Snippet: ${result.description}

Return JSON:
{
  "title": "paper/report title",
  "authors": "author names or organization",
  "year": number_or_null,
  "methodology": "qualitative|quantitative|mixed_methods|meta_analysis|systematic_review|null",
  "key_findings": "2-3 sentence summary of findings",
  "relevance_to_youth_justice": "high|medium|low",
  "outcome_types": ["relevant outcome categories"],
  "geographic_focus": "state/national/international",
  "indigenous_focus": true/false,
  "sample_size": "number or description or null",
  "recidivism_data": true/false
}`;

      const response = await llm.chat([{ role: 'user', content: prompt }]);
      const parsed = parseJSON(response);

      if (parsed && parsed.relevance_to_youth_justice !== 'low') {
        // Determine finding_type from content
        const text = `${parsed.title || ''} ${parsed.key_findings || ''}`.toLowerCase();
        let findingType = 'external_source';
        if (text.includes('evaluation') || text.includes('outcomes') || text.includes('effectiveness')) findingType = 'evidence_link';
        else if (text.includes('recommend') || text.includes('policy')) findingType = 'recommendation';
        else if (text.includes('gap') || text.includes('barrier')) findingType = 'gap_identified';

        const { error } = await supabase.from('alma_research_findings').insert({
          finding_type: findingType,
          content: {
            title: parsed.title || result.title,
            key_findings: parsed.key_findings,
            authors: parsed.authors,
            year: parsed.year,
            methodology: parsed.methodology,
            outcome_types: parsed.outcome_types,
            geographic_focus: parsed.geographic_focus,
            indigenous_focus: parsed.indigenous_focus,
            sample_size: parsed.sample_size,
            recidivism_data: parsed.recidivism_data,
          },
          confidence: parsed.relevance_to_youth_justice === 'high' ? 0.9 : 0.7,
          validation_source: parsed.title || result.title,
          sources: [result.url],
        });

        if (!error) inserted++;
      }
    } catch (err) {
      console.error('[ALMA Enrich] Research:', err);
    }
  }

  return { mode: 'research', searched: term, found: results.length, inserted, duplicates };
}

export async function POST(request: NextRequest) {
  return GET(request);
}
