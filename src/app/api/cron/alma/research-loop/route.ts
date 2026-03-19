import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { LLMClient } from '@/lib/ai/model-router';
import { parseJSON } from '@/lib/ai/parse-json';
import { searchWeb } from '@/lib/scraping/web-search';
import { searchAustralianYouthJusticeResearch } from '@/lib/scraping/research-apis';
import {
  EvidenceDiscoveryResponseSchema,
  validateLLMOutput,
} from '@/lib/ai/llm-schemas';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // Allow local dev access when no CRON_SECRET is configured
  if (!secret) return process.env.NODE_ENV === 'development';
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

/**
 * ALMA Research Loop — Gap-Driven Discovery
 *
 * Closes the loop between analysis and research:
 * 1. MEASURE — score coverage across all data dimensions
 * 2. IDENTIFY — find the weakest areas (propose)
 * 3. DISCOVER — search for data to fill gaps (run)
 * 4. EVALUATE — validate and insert (evaluate)
 * 5. REPORT — update coverage metrics (keep/revert)
 *
 * Inspired by autoresearch propose→evaluate→keep/revert loops.
 * Each run targets the WEAKEST dimension, so the system self-balances.
 *
 * GET /api/cron/alma/research-loop?dry_run=true  — gap analysis only
 * GET /api/cron/alma/research-loop                — full loop cycle
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get('dry_run') === 'true';
  const supabase = createServiceClient();

  // ═══════════════════════════════════════
  // PHASE 1: MEASURE — Coverage Gap Analysis
  // ═══════════════════════════════════════

  const [
    { count: totalInterventions },
    { count: totalEvidence },
    { count: totalOutcomeLinks },
    { count: totalEvidenceLinks },
    { count: totalStories },
    { count: totalFindings },
    { count: totalMedia },
    { count: totalDocs },
    { count: totalCases },
    { count: totalCampaigns },
    { count: totalSources },
    { count: interventionsWithCost },
    { count: evidenceWithMetadata },
    { count: australianCases },
  ] = await Promise.all([
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).neq('verification_status', 'ai_generated'),
    supabase.from('alma_evidence').select('*', { count: 'exact', head: true }),
    supabase.from('alma_intervention_outcomes').select('*', { count: 'exact', head: true }),
    supabase.from('alma_intervention_evidence').select('*', { count: 'exact', head: true }),
    supabase.from('alma_stories').select('*', { count: 'exact', head: true }),
    supabase.from('alma_research_findings').select('*', { count: 'exact', head: true }),
    supabase.from('alma_media_articles').select('*', { count: 'exact', head: true }),
    supabase.from('alma_source_documents').select('*', { count: 'exact', head: true }),
    supabase.from('justice_matrix_cases').select('*', { count: 'exact', head: true }),
    supabase.from('justice_matrix_campaigns').select('*', { count: 'exact', head: true }),
    supabase.from('justice_matrix_sources').select('*', { count: 'exact', head: true }),
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).neq('verification_status', 'ai_generated').not('cost_per_young_person', 'is', null),
    supabase.from('alma_evidence').select('*', { count: 'exact', head: true }).neq('metadata', '{}'),
    supabase.from('justice_matrix_cases').select('*', { count: 'exact', head: true }).ilike('jurisdiction', '%Australia%'),
  ]);

  // State coverage analysis — derive from intervention names/orgs since no state column exists
  const states = ['QLD', 'NSW', 'VIC', 'WA', 'SA', 'NT', 'ACT', 'TAS'];
  const stateKeywords: Record<string, string[]> = {
    QLD: ['Queensland', 'QLD', 'Brisbane', 'Gold Coast', 'Cairns', 'Townsville', 'Cleveland'],
    NSW: ['New South Wales', 'NSW', 'Sydney', 'Western Sydney', 'Bourke', 'Mount Druitt'],
    VIC: ['Victoria', 'VIC', 'Melbourne', 'Koori Court'],
    WA: ['Western Australia', 'WA', 'Perth', 'Banksia Hill', 'Broome', 'Kimberley'],
    SA: ['South Australia', 'SA', 'Adelaide', 'Kurlana Tapa'],
    NT: ['Northern Territory', 'NT', 'Darwin', 'Alice Springs', 'Don Dale', 'Tiwi'],
    ACT: ['ACT', 'Canberra', 'Australian Capital Territory'],
    TAS: ['Tasmania', 'TAS', 'Hobart', 'Ashley'],
  };

  const { data: interventionsForState } = await supabase
    .from('alma_interventions')
    .select('name, operating_organization')
    .neq('verification_status', 'ai_generated');

  const stateCoverage: Record<string, number> = {};
  for (const state of states) {
    const keywords = stateKeywords[state];
    stateCoverage[state] = (interventionsForState || []).filter(
      (i: { name: string; operating_organization: string | null }) => {
        const text = `${i.name} ${i.operating_organization || ''}`.toLowerCase();
        return keywords.some(k => text.includes(k.toLowerCase()));
      }
    ).length;
  }

  // Intervention type coverage
  const { data: interventionsByType } = await supabase
    .from('alma_interventions')
    .select('type')
    .neq('verification_status', 'ai_generated');

  const typeCoverage: Record<string, number> = {};
  for (const i of interventionsByType || []) {
    if (i.type) typeCoverage[i.type] = (typeCoverage[i.type] || 0) + 1;
  }

  // ═══════════════════════════════════════
  // PHASE 2: IDENTIFY — Score & Rank Gaps
  // ═══════════════════════════════════════

  const ti = totalInterventions || 826;
  const te = totalEvidence || 570;

  const dimensions = [
    {
      id: 'evidence_coverage',
      name: 'Evidence per Intervention',
      score: Math.min(1, (totalEvidenceLinks || 0) / (ti * 2)), // target: 2 evidence per intervention
      target: ti * 2,
      current: totalEvidenceLinks || 0,
      action: 'discover_evidence',
      description: `${totalEvidenceLinks || 0} evidence links for ${ti} interventions (target: ${ti * 2})`,
    },
    {
      id: 'cost_data',
      name: 'Cost Data Coverage',
      score: (interventionsWithCost || 0) / ti,
      target: ti,
      current: interventionsWithCost || 0,
      action: 'enrich_costs',
      description: `${interventionsWithCost || 0}/${ti} interventions have cost data`,
    },
    {
      id: 'evidence_metadata',
      name: 'Evidence Metadata Enrichment',
      score: (evidenceWithMetadata || 0) / te,
      target: te,
      current: evidenceWithMetadata || 0,
      action: 'enrich_metadata',
      description: `${evidenceWithMetadata || 0}/${te} evidence items have enriched metadata`,
    },
    {
      id: 'media_coverage',
      name: 'Media Article Coverage',
      score: Math.min(1, (totalMedia || 0) / 200), // target: 200 articles
      target: 200,
      current: totalMedia || 0,
      action: 'discover_media',
      description: `${totalMedia || 0}/200 target media articles`,
    },
    {
      id: 'stories',
      name: 'Story Coverage',
      score: Math.min(1, (totalStories || 0) / 50), // target: 50 stories
      target: 50,
      current: totalStories || 0,
      action: 'discover_stories',
      description: `${totalStories || 0}/50 target stories`,
    },
    {
      id: 'research_findings',
      name: 'Research Findings',
      score: Math.min(1, (totalFindings || 0) / 100), // target: 100 findings
      target: 100,
      current: totalFindings || 0,
      action: 'discover_research',
      description: `${totalFindings || 0}/100 target research findings`,
    },
    {
      id: 'australian_cases',
      name: 'Australian Case Law Coverage',
      score: Math.min(1, (australianCases || 0) / 80), // target: 80 cases
      target: 80,
      current: australianCases || 0,
      action: 'discover_cases',
      description: `${australianCases || 0}/80 target Australian cases`,
    },
    {
      id: 'source_documents',
      name: 'Source Documents',
      score: Math.min(1, (totalDocs || 0) / 100), // target: 100 docs
      target: 100,
      current: totalDocs || 0,
      action: 'discover_docs',
      description: `${totalDocs || 0}/100 target source documents`,
    },
  ];

  // Sort by score ascending — weakest first
  dimensions.sort((a, b) => a.score - b.score);
  const overallScore = dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length;

  // Identify weakest states
  const stateGaps = states
    .map((s) => ({ state: s, count: stateCoverage[s] || 0 }))
    .sort((a, b) => a.count - b.count);

  const gapAnalysis = {
    overall_coverage_score: Math.round(overallScore * 100) / 100,
    dimensions,
    state_coverage: stateCoverage,
    state_gaps: stateGaps.slice(0, 3), // 3 weakest states
    type_coverage: typeCoverage,
    weakest_dimension: dimensions[0],
    recommended_actions: dimensions.slice(0, 3).map((d) => ({
      action: d.action,
      dimension: d.name,
      score: Math.round(d.score * 100) + '%',
      gap: d.target - d.current,
    })),
  };

  if (dryRun) {
    return NextResponse.json({
      mode: 'gap_analysis',
      gap_analysis: gapAnalysis,
      timestamp: new Date().toISOString(),
    });
  }

  // ═══════════════════════════════════════
  // PHASE 3: DISCOVER — Target Weakest Area
  // ═══════════════════════════════════════

  // Skip cost_data if it's the weakest — web search can't extract cost figures reliably.
  // Cost data needs structured import from ROGS/AIHW reports.
  const actionableActions = new Set([
    'enrich_metadata', 'discover_media',
    'discover_research', 'discover_docs',
    // NOT: enrich_costs (ROGS-backed, done), discover_stories/discover_cases (curated), discover_evidence (saturated - all URLs deduplicated)
  ]);
  const target = dimensions.find(d => actionableActions.has(d.action)) || dimensions[0];
  const results: {
    targeted_dimension: string;
    action: string;
    discovered: number;
    inserted: number;
    errors: string[];
  } = {
    targeted_dimension: target.name,
    action: target.action,
    discovered: 0,
    inserted: 0,
    errors: [],
  };

  try {
    switch (target.action) {
      case 'discover_evidence': {
        // Find interventions with fewest evidence links
        const { data: evCounts } = await supabase
          .from('alma_intervention_evidence')
          .select('intervention_id');
        const evMap: Record<string, number> = {};
        for (const link of evCounts || []) {
          evMap[link.intervention_id] = (evMap[link.intervention_id] || 0) + 1;
        }

        const { data: interventions } = await supabase
          .from('alma_interventions')
          .select('id, name, type, operating_organization')
          .neq('verification_status', 'ai_generated')
          .limit(200);

        // Prioritize interventions with 0 evidence, then 1, etc
        const sorted = (interventions || [])
          .map((i) => ({ ...i, evCount: evMap[i.id] || 0 }))
          .sort((a, b) => a.evCount - b.evCount)
          .slice(0, 5);

        const existingUrls = new Set(
          ((await supabase.from('alma_evidence').select('source_url')).data || [])
            .map((e: { source_url: string }) => e.source_url)
            .filter(Boolean)
        );

        for (const intervention of sorted) {
          const query = `"${intervention.name.substring(0, 50)}" ${intervention.type || ''} evaluation outcomes youth justice Australia`;
          const searchResults = await searchWeb(query);
          const newResults = searchResults.filter((r) => r.url && !existingUrls.has(r.url));
          if (!newResults.length) continue;

          results.discovered += newResults.length;

          const prompt = `You are an Australian youth justice researcher. Evaluate search results for evidence about "${intervention.name}" (${intervention.type}).

${newResults.slice(0, 5).map((r, i) => `${i + 1}. "${r.title}" — ${r.url}\n   ${r.snippet || ''}`).join('\n')}

For relevant results (score >= 0.4), return JSON: { "results": [{ "title": "...", "evidence_type": "Program evaluation|Case study|Policy analysis|Community-led research|Government report|Media coverage", "url": "...", "findings": "...", "methodology": null, "author": null, "year": null, "relevance_score": 0.0 }] }`;

          try {
            const raw = await LLMClient.getBackgroundInstance().call(prompt, { maxTokens: 2000 });
            const parsed = parseJSON(raw);
            const validated = validateLLMOutput(parsed, EvidenceDiscoveryResponseSchema);
            if (!validated.success) continue;

            for (const ev of validated.data.results) {
              if ((ev.relevance_score || 0) < 0.4 || existingUrls.has(ev.url)) continue;

              const { data: inserted } = await supabase
                .from('alma_evidence')
                .upsert({
                  title: (ev.title || '').substring(0, 500),
                  evidence_type: ev.evidence_type || 'Case study',
                  findings: ev.findings,
                  source_url: ev.url,
                  methodology: ev.methodology || null,
                  author: ev.author || null,
                  publication_date: ev.year ? `${ev.year}-01-01` : null,
                  consent_level: 'Public Knowledge Commons',
                  metadata: { auto_discovered: true, discovery_method: 'research_loop', loop_cycle: new Date().toISOString() },
                }, { onConflict: 'source_url', ignoreDuplicates: true })
                .select('id')
                .single();

              if (inserted) {
                existingUrls.add(ev.url);
                results.inserted++;
                await supabase
                  .from('alma_intervention_evidence')
                  .insert({ intervention_id: intervention.id, evidence_id: inserted.id });
              }
            }
          } catch (err) {
            results.errors.push(`${intervention.name}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
        break;
      }

      case 'enrich_costs': {
        // Delegate to existing enrichment endpoint logic
        const { data: interventions } = await supabase
          .from('alma_interventions')
          .select('id, name, type, operating_organization')
          .neq('verification_status', 'ai_generated')
          .is('cost_per_young_person', null)
          .not('operating_organization', 'is', null)
          .limit(5);

        for (const item of interventions || []) {
          const query = `"${item.name}" OR "${item.operating_organization}" cost per participant annual report youth justice`;
          const searchResults = await searchWeb(query);
          if (!searchResults?.length) continue;

          results.discovered++;
          const snippets = searchResults.slice(0, 3).map((r) => `${r.title}: ${r.snippet}`).join('\n');

          try {
            const raw = await LLMClient.getBackgroundInstance().call(
              `From these search results, determine the annual cost per young person/participant for the program "${item.name}" run by "${item.operating_organization}".

Search results:
${snippets}

IMPORTANT: You MUST respond with ONLY valid JSON, nothing else. No explanation, no preamble.
If you find a cost figure, return: {"cost_per_young_person": 12000, "cost_source": "source of the figure"}
If you cannot determine the cost, return: {"cost_per_young_person": null, "cost_source": null}`,
              { maxTokens: 300 }
            );
            const parsed = parseJSON(raw);
            if (parsed?.cost_per_young_person && typeof parsed.cost_per_young_person === 'number') {
              await supabase
                .from('alma_interventions')
                .update({ cost_per_young_person: parsed.cost_per_young_person })
                .eq('id', item.id);
              results.inserted++;
            }
          } catch (err) {
            results.errors.push(`Cost ${item.name}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
        break;
      }

      case 'enrich_metadata': {
        const { data: evidence } = await supabase
          .from('alma_evidence')
          .select('id, title, findings, evidence_type, source_url')
          .eq('metadata', '{}')
          .limit(10);

        for (const item of evidence || []) {
          results.discovered++;
          try {
            const raw = await LLMClient.getBackgroundInstance().call(
              `Analyze this youth justice evidence and extract metadata:\nTitle: ${item.title}\nFindings: ${item.findings || ''}\nType: ${item.evidence_type}\n\nReturn JSON: { "outcome_types": ["..."], "methodology": "qualitative|quantitative|mixed_methods|null", "indigenous_focus": true/false, "evidence_strength": "strong|moderate|emerging|anecdotal", "key_findings": "1-2 sentences" }`,
              { maxTokens: 500 }
            );
            const parsed = parseJSON(raw);
            if (parsed && typeof parsed === 'object') {
              await supabase.from('alma_evidence').update({ metadata: parsed }).eq('id', item.id);
              results.inserted++;
            }
          } catch (err) {
            results.errors.push(`Metadata ${item.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
        break;
      }

      case 'discover_media': {
        // Search for recent youth justice media coverage
        const weakestState = stateGaps[0]?.state || 'QLD';
        const mediaQueries = [
          `youth detention ${weakestState} Australia 2024`,
          `Aboriginal youth justice reform Australia 2024`,
          `raise the age criminal responsibility Australia`,
          `youth justice funding cuts Australia`,
        ];
        const query = mediaQueries[Math.floor(Math.random() * mediaQueries.length)];
        const searchResults = await searchWeb(query);

        const existingUrls = new Set(
          ((await supabase.from('alma_media_articles').select('url')).data || [])
            .map((a: { url: string }) => a.url).filter(Boolean)
        );

        for (const r of searchResults.slice(0, 8)) {
          if (!r.url || existingUrls.has(r.url)) continue;
          results.discovered++;

          try {
            const raw = await LLMClient.getBackgroundInstance().call(
              `Analyze this media article about Australian youth justice:\nTitle: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}\n\nReturn JSON: { "headline": "...", "summary": "2-3 sentences", "sentiment": "positive|negative|mixed|neutral", "topics": ["..."], "state": "QLD|NSW|VIC|WA|SA|NT|ACT|TAS|national" }`,
              { maxTokens: 500 }
            );
            const parsed = parseJSON(raw);
            if (parsed?.headline) {
              const { error } = await supabase.from('alma_media_articles').insert({
                headline: parsed.headline,
                url: r.url,
                source_name: new URL(r.url).hostname.replace('www.', ''),
                summary: parsed.summary,
                sentiment: parsed.sentiment,
                topics: parsed.topics,
              });
              if (!error) {
                results.inserted++;
                existingUrls.add(r.url);
              }
            }
          } catch (err) {
            results.errors.push(`Media: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
        break;
      }

      case 'discover_research': {
        // Use OpenAlex API for structured academic paper discovery — no LLM needed
        const researchTopics = [
          'recidivism reduction diversion',
          'Indigenous youth detention overrepresentation',
          'youth detention alternatives cost effectiveness',
          'Aboriginal community-led justice reinvestment',
          'restorative justice conferencing outcomes',
          'on-country programs cultural healing',
          'custody notification service deaths in custody',
          'fetal alcohol spectrum disorder detention',
          'raise the age criminal responsibility',
          'youth justice therapeutic models',
        ];
        const topic = researchTopics[Math.floor(Math.random() * researchTopics.length)];
        const papers = await searchAustralianYouthJusticeResearch(topic, 2018, 10);

        // Get existing source URLs to avoid duplicates
        const existingFindings = new Set(
          ((await supabase.from('alma_research_findings').select('validation_source')).data || [])
            .map((f: { validation_source: string }) => f.validation_source?.toLowerCase())
            .filter(Boolean)
        );

        for (const paper of papers) {
          if (!paper.title) continue;
          // Skip if we already have a finding from this paper
          if (existingFindings.has(paper.title.toLowerCase())) continue;

          results.discovered++;

          // Determine finding type from title/abstract
          const text = `${paper.title} ${paper.abstract || ''}`.toLowerCase();
          let findingType = 'external_source';
          if (text.includes('evaluation') || text.includes('outcomes') || text.includes('effectiveness')) findingType = 'evidence_link';
          else if (text.includes('recommend') || text.includes('policy')) findingType = 'recommendation';
          else if (text.includes('gap') || text.includes('barrier') || text.includes('failure')) findingType = 'gap_identified';
          else if (text.includes('new') || text.includes('innovative') || text.includes('pilot')) findingType = 'new_intervention';

          // Build content from structured data — no LLM call needed
          const authorStr = paper.authors.slice(0, 3).join(', ');
          const content = paper.abstract
            ? paper.abstract.substring(0, 500)
            : `${paper.title}. Published in ${paper.source || 'academic journal'} (${paper.year || 'n.d.'}). ${paper.cited_by_count > 0 ? `Cited ${paper.cited_by_count} times.` : ''}`;

          const { error } = await supabase.from('alma_research_findings').insert({
            finding_type: findingType,
            content,
            confidence: paper.cited_by_count > 20 ? 0.9 : paper.cited_by_count > 5 ? 0.8 : 0.7,
            validated: paper.open_access, // OA papers are easier to verify
            validation_source: paper.title,
            sources: [paper.url, ...(paper.doi ? [`doi:${paper.doi}`] : []), ...(authorStr ? [`Authors: ${authorStr}`] : [])],
          });
          if (!error) {
            results.inserted++;
            existingFindings.add(paper.title.toLowerCase());
          }
        }
        break;
      }

      case 'discover_docs': {
        const docQueries = [
          'site:aihw.gov.au youth justice report',
          'site:pc.gov.au report government services youth justice',
          'Australian youth detention inspection report 2024',
          'Aboriginal youth justice policy document Australia',
          'site:humanrights.gov.au children detention',
          'youth justice annual report 2024 Australia state government',
        ];
        const dQuery = docQueries[Math.floor(Math.random() * docQueries.length)];
        const dResults = await searchWeb(dQuery);

        const existingDocUrls = new Set(
          ((await supabase.from('alma_source_documents').select('source_url')).data || [])
            .map((d: { source_url: string }) => d.source_url).filter(Boolean)
        );

        for (const r of dResults.slice(0, 6)) {
          if (!r.url || existingDocUrls.has(r.url)) continue;
          results.discovered++;
          try {
            const raw = await LLMClient.getBackgroundInstance().call(
              `Analyze this search result and extract source document metadata for Australian youth justice research.
Title: ${r.title}
URL: ${r.url}
Snippet: ${r.snippet}

IMPORTANT: Respond with ONLY valid JSON.
{"title": "document title", "document_type": "government_report|statistical_report|academic_paper|inquiry_report|evaluation_report|policy_document|community_report|media_article|other", "authority_level": "government_official|peer_reviewed|grey_literature|community_voice|media|primary_source", "source_organization": "publisher name", "jurisdiction": "national|QLD|NSW|VIC|WA|SA|NT|ACT|TAS", "scope": "national|state|local", "key_findings": ["finding 1", "finding 2"]}`,
              { maxTokens: 400 }
            );
            const parsed = parseJSON(raw);
            if (parsed?.title) {
              const validDocTypes = ['government_report', 'statistical_report', 'academic_paper', 'inquiry_report', 'evaluation_report', 'policy_document', 'community_report', 'media_article', 'other'];
              const validAuth = ['government_official', 'peer_reviewed', 'grey_literature', 'community_voice', 'media', 'primary_source'];
              const validScopes = ['national', 'state', 'local'];

              const { error } = await supabase.from('alma_source_documents').upsert({
                title: parsed.title,
                source_url: r.url,
                document_type: validDocTypes.includes(parsed.document_type) ? parsed.document_type : 'other',
                authority_level: validAuth.includes(parsed.authority_level) ? parsed.authority_level : 'grey_literature',
                source_organization: parsed.source_organization || null,
                jurisdiction: parsed.jurisdiction || 'national',
                scope: validScopes.includes(parsed.scope) ? parsed.scope : 'national',
                key_findings: parsed.key_findings || [],
              }, { onConflict: 'source_url', ignoreDuplicates: true });
              if (!error) {
                results.inserted++;
                existingDocUrls.add(r.url);
              }
            }
          } catch (err) {
            results.errors.push(`Doc: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
        break;
      }

      case 'discover_stories':
      case 'discover_cases': {
        // These require curated data — flag for manual enrichment
        results.errors.push(`Action ${target.action} needs curated input — skipping automated discovery`);
        break;
      }
    }
  } catch (err) {
    results.errors.push(`Loop: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ═══════════════════════════════════════
  // PHASE 4: EVALUATE — Post-Loop Metrics
  // ═══════════════════════════════════════

  // Re-measure the targeted dimension
  let postScore = target.score;
  if (results.inserted > 0) {
    const postCount = target.current + results.inserted;
    postScore = Math.min(1, postCount / target.target);
  }

  const delta = postScore - target.score;

  return NextResponse.json({
    mode: 'research_loop',
    cycle: {
      targeted: target.name,
      action: target.action,
      pre_score: Math.round(target.score * 100) + '%',
      post_score: Math.round(postScore * 100) + '%',
      delta: delta > 0 ? `+${Math.round(delta * 100)}%` : '0%',
      discovered: results.discovered,
      inserted: results.inserted,
      errors: results.errors,
    },
    gap_analysis: gapAnalysis,
    next_targets: dimensions.slice(1, 4).map((d) => ({
      dimension: d.name,
      score: Math.round(d.score * 100) + '%',
      action: d.action,
    })),
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
