/**
 * ALMA Tool Definitions for Agentic Chat
 *
 * 17 tools the LLM can call to query real data from Supabase,
 * GrantScope entity graph, and Empathy Ledger community voices.
 * Used with Vercel AI SDK's streamText() tool calling.
 *
 * Column names verified against actual DB schema 2026-03-13.
 */

// AI SDK expects Zod v3 schemas
import { z } from 'zod/v3';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getEntityEnrichment } from '@/lib/grantscope/entity-enrichment';
import { getStorytellers, getTranscripts, getMedia, isV2Configured } from '@/lib/empathy-ledger/v2-client';

const STATES = ['nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt'] as const;

/** Escape PostgREST special characters in user input for ilike/or filters */
function sanitize(input: string): string {
  return input.replace(/[%_\\(),"']/g, '');
}

export const almaTools = {
  search_interventions: {
    description:
      'Search youth justice interventions/programs by keyword, geography, or type. Returns verified programs with evidence levels and costs.',
    inputSchema: z.object({
      query: z.string().optional().describe('Search keyword (e.g. "diversion", "mentoring", "Aboriginal")'),
      state: z.enum(STATES).optional().describe('Australian state/territory code to filter by geography'),
      type: z.string().optional().describe('Program type (e.g. "diversion", "rehabilitation", "prevention")'),
      limit: z.number().min(1).max(20).default(10),
    }),
    execute: async ({ query, state: rawState, type, limit }: { query?: string; state?: string; type?: string; limit: number }) => {
      const supabase = createServiceClient();
      const state = rawState?.toUpperCase();
      let q = supabase
        .from('alma_interventions')
        .select('id, name, description, type, geography, evidence_level, cost_per_young_person, operating_organization')
        .neq('verification_status', 'ai_generated');

      if (query) { const s = sanitize(query); q = q.or(`name.ilike.%${s}%,description.ilike.%${s}%`); }
      if (state) q = q.overlaps('geography', [state]);
      if (type) { const s = sanitize(type); q = q.ilike('type', `%${s}%`); }

      const { data, error } = await q.limit(limit);
      if (error) return { error: error.message };
      return { interventions: data || [], count: data?.length || 0 };
    },
  },

  get_spending_data: {
    description:
      'Get ROGS government spending data on youth justice by state and category. Source: Productivity Commission Report on Government Services 2026.',
    inputSchema: z.object({
      state: z.enum(STATES).optional().describe('State to filter (omit for national)'),
      category: z
        .enum(['detention', 'community', 'conferencing', 'total'])
        .optional()
        .describe('Spending category'),
    }),
    execute: async ({ state: rawState, category }: { state?: string; category?: string }) => {
      const supabase = createServiceClient();
      const state = rawState?.toLowerCase();

      const categoryMap: Record<string, string> = {
        detention: 'Detention-based services',
        community: 'Community-based services',
        conferencing: 'Group conferencing',
        total: 'Total expenditure',
      };

      let q = supabase
        .from('rogs_justice_spending')
        .select('*')
        .eq('rogs_section', 'youth_justice')
        .eq('rogs_table', '17A.10')
        .eq('financial_year', '2024-25')
        .eq('unit', "$'000");

      if (category && categoryMap[category]) {
        q = q.eq('description3', categoryMap[category]);
      } else {
        q = q.in('description3', [
          'Detention-based services',
          'Community-based services',
          'Group conferencing',
          'Total expenditure',
        ]);
      }

      const { data, error } = await q;
      if (error) return { error: error.message };

      // Pivot state columns into human-readable format
      const results = (data || []).map((row: Record<string, unknown>) => {
        const stateValues: Record<string, string> = {};
        for (const s of STATES) {
          if (!state || s === state) {
            const val = row[s];
            if (val !== null && val !== undefined) {
              const millions = (Number(val) / 1000).toFixed(1);
              stateValues[s.toUpperCase()] = `$${millions} million`;
            }
          }
        }
        return {
          category: String(row.description3),
          financial_year: String(row.financial_year),
          ...stateValues,
        };
      });

      return {
        spending: results,
        source: 'ROGS 2026 — Productivity Commission Report on Government Services',
        note: 'Cost per day: $3,635 detention, $424 community (national average 2024-25).',
      };
    },
  },

  compare_jurisdictions: {
    description:
      'Compare youth justice metrics across Australian states/territories. Can compare spending, detention rates, or Indigenous overrepresentation.',
    inputSchema: z.object({
      metric: z
        .enum(['spending', 'detention_population', 'indigenous_ratio'])
        .describe('What to compare'),
      states: z
        .array(z.enum(STATES))
        .optional()
        .describe('States to compare (omit for all)'),
    }),
    execute: async ({ metric, states: rawStates }: { metric: string; states?: string[] }) => {
      const supabase = createServiceClient();
      const compareStates = rawStates?.map((s) => s.toLowerCase()) || [...STATES];

      if (metric === 'spending') {
        const { data } = await supabase
          .from('rogs_justice_spending')
          .select('*')
          .eq('rogs_section', 'youth_justice')
          .eq('rogs_table', '17A.10')
          .eq('financial_year', '2024-25')
          .eq('unit', "$'000")
          .eq('description3', 'Total expenditure');

        const row = data?.[0] as Record<string, unknown> | undefined;
        if (!row) return { error: 'No spending data found' };
        const comparison = compareStates.map((s) => ({
          state: s.toUpperCase(),
          total_spending_thousands: row[s],
        }));
        return { metric: 'Total Youth Justice Spending ($\'000)', financial_year: '2024-25', comparison, source: 'ROGS 2026' };
      }

      if (metric === 'detention_population') {
        const { data } = await supabase
          .from('rogs_justice_spending')
          .select('*')
          .eq('rogs_section', 'youth_justice')
          .eq('rogs_table', '17A.1')
          .eq('financial_year', '2024-25')
          .eq('unit', 'no.')
          .eq('description2', 'Detention')
          .eq('indigenous_status', 'All people');

        const row = data?.[0] as Record<string, unknown> | undefined;
        if (!row) return { error: 'No detention population data found' };
        const comparison = compareStates.map((s) => ({
          state: s.toUpperCase(),
          avg_daily_detention: row[s],
        }));
        return { metric: 'Average Daily Youth Detention Population', financial_year: '2024-25', comparison, source: 'ROGS 2026' };
      }

      if (metric === 'indigenous_ratio') {
        const { data } = await supabase
          .from('rogs_justice_spending')
          .select('*')
          .eq('rogs_section', 'youth_justice')
          .eq('rogs_table', '17A.7')
          .eq('financial_year', '2024-25')
          .eq('unit', 'ratio')
          .like('service_type', '%Detention%');

        const row = data?.[0] as Record<string, unknown> | undefined;
        if (!row) return { error: 'No Indigenous ratio data found' };
        const comparison = compareStates.map((s) => ({
          state: s.toUpperCase(),
          indigenous_overrepresentation_ratio: row[s],
        }));
        return { metric: 'Indigenous Youth Overrepresentation in Detention (ratio)', financial_year: '2024-25', comparison, source: 'ROGS 2026' };
      }

      return { error: 'Unknown metric' };
    },
  },

  search_evidence: {
    description:
      'Search research evidence, academic papers, and findings related to youth justice.',
    inputSchema: z.object({
      query: z.string().describe('Search term (e.g. "recidivism", "diversion effectiveness")'),
      limit: z.number().min(1).max(20).default(10),
    }),
    execute: async ({ query, limit }: { query: string; limit: number }) => {
      const supabase = createServiceClient();

      const [evidenceResult, findingsResult] = await Promise.all([
        supabase
          .from('alma_evidence')
          .select('id, title, findings, evidence_type, source_url, year_published')
          .or(`title.ilike.%${sanitize(query)}%,findings.ilike.%${sanitize(query)}%`)
          .limit(limit),
        supabase
          .from('alma_research_findings')
          .select('id, finding_type, content, confidence, sources')
          .or(`content.ilike.%${sanitize(query)}%`)
          .limit(5),
      ]);

      return {
        evidence: evidenceResult.data || [],
        findings: findingsResult.data || [],
        total: (evidenceResult.data?.length || 0) + (findingsResult.data?.length || 0),
      };
    },
  },

  search_cases: {
    description:
      'Search legal cases, inquiries, royal commissions, and government reviews related to youth justice.',
    inputSchema: z.object({
      query: z.string().describe('Search term (e.g. "Royal Commission", "Don Dale", "Raise the Age")'),
      limit: z.number().min(1).max(20).default(10),
    }),
    execute: async ({ query, limit }: { query: string; limit: number }) => {
      const supabase = createServiceClient();

      // Split query into significant words for broader matching
      const words = query.split(/\s+/).filter((w) => w.length > 2).map(sanitize).filter(Boolean);
      const sq = sanitize(query);
      const caseFilters = words.length > 0
        ? words.map((w) => `case_citation.ilike.%${w}%,key_holding.ilike.%${w}%,strategic_issue.ilike.%${w}%`).join(',')
        : `case_citation.ilike.%${sq}%`;
      const inquiryFilters = words.length > 0
        ? words.map((w) => `title.ilike.%${w}%,summary.ilike.%${w}%`).join(',')
        : `title.ilike.%${sq}%`;

      const [casesResult, inquiriesResult] = await Promise.all([
        supabase
          .from('justice_matrix_cases')
          .select('id, case_citation, jurisdiction, outcome, precedent_strength, key_holding, strategic_issue')
          .or(caseFilters || `case_citation.ilike.%${query}%`)
          .limit(limit),
        supabase
          .from('historical_inquiries')
          .select('id, title, jurisdiction, year_published, summary, recommendations_count')
          .or(inquiryFilters || `title.ilike.%${query}%`)
          .limit(5),
      ]);

      return {
        cases: casesResult.data || [],
        inquiries: inquiriesResult.data || [],
        total: (casesResult.data?.length || 0) + (inquiriesResult.data?.length || 0),
      };
    },
  },

  search_campaigns: {
    description:
      'Search advocacy campaigns and movements in youth justice (e.g. Raise the Age, Close the Gap).',
    inputSchema: z.object({
      query: z.string().describe('Search term'),
      limit: z.number().min(1).max(20).default(10),
    }),
    execute: async ({ query, limit }: { query: string; limit: number }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('justice_matrix_campaigns')
        .select('id, campaign_name, goals, outcome_status, country_region, campaign_type, lead_organizations')
        .or(`campaign_name.ilike.%${sanitize(query)}%,goals.ilike.%${sanitize(query)}%`)
        .limit(limit);

      if (error) return { error: error.message };
      return { campaigns: data || [], count: data?.length || 0 };
    },
  },

  search_media: {
    description:
      'Search media articles and news coverage about youth justice issues.',
    inputSchema: z.object({
      query: z.string().describe('Search term'),
      limit: z.number().min(1).max(20).default(10),
    }),
    execute: async ({ query, limit }: { query: string; limit: number }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('alma_media_articles')
        .select('id, headline, source_name, published_date, url, summary, sentiment')
        .or(`headline.ilike.%${sanitize(query)}%,summary.ilike.%${sanitize(query)}%`)
        .limit(limit);

      if (error) return { error: error.message };
      return { articles: data || [], count: data?.length || 0 };
    },
  },

  search_funding: {
    description:
      'Search government funding records — grants, contracts, and spending allocations to organisations. 64,800+ records covering QLD historical grants, federal funding, state allocations.',
    inputSchema: z.object({
      query: z.string().optional().describe('Search keyword for organisation or program name'),
      state: z.enum(STATES).optional().describe('State/territory to filter'),
      source: z.string().optional().describe('Funding source (e.g. "QLD DYJVS", "Federal", "ROGS")'),
      min_amount: z.number().optional().describe('Minimum dollar amount'),
      limit: z.number().min(1).max(50).default(20),
    }),
    execute: async ({ query, state: rawState, source, min_amount, limit }: { query?: string; state?: string; source?: string; min_amount?: number; limit: number }) => {
      const supabase = createServiceClient();
      let q = supabase
        .from('justice_funding')
        .select('id, recipient_name, amount_dollars, source, financial_year, program_name, state, project_description')
        .order('amount_dollars', { ascending: false, nullsFirst: false });

      if (query) { const s = sanitize(query); q = q.or(`recipient_name.ilike.%${s}%,program_name.ilike.%${s}%,project_description.ilike.%${s}%`); }
      if (rawState) q = q.ilike('state', rawState);
      if (source) { const s = sanitize(source); q = q.ilike('source', `%${s}%`); }
      if (min_amount != null) q = q.gte('amount_dollars', min_amount);

      // Parallel: get results + total count with same filters
      let cq = supabase.from('justice_funding').select('*', { count: 'exact', head: true });
      if (query) { const s = sanitize(query); cq = cq.or(`recipient_name.ilike.%${s}%,program_name.ilike.%${s}%,project_description.ilike.%${s}%`); }
      if (rawState) cq = cq.ilike('state', rawState);
      if (source) { const s = sanitize(source); cq = cq.ilike('source', `%${s}%`); }
      if (min_amount != null) cq = cq.gte('amount_dollars', min_amount);

      const [{ data, error }, { count: totalMatches }] = await Promise.all([q.limit(limit), cq]);
      if (error) return { error: error.message };

      const totalAmount = (data || []).reduce((sum: number, r: Record<string, unknown>) => sum + (Number(r.amount_dollars) || 0), 0);
      return {
        funding: data || [],
        showing: data?.length || 0,
        total_matches: totalMatches || data?.length || 0,
        total_amount_shown: `$${(totalAmount / 1_000_000).toFixed(1)}M`,
        note: 'Sorted by amount descending. Use min_amount to filter small grants.',
      };
    },
  },

  search_stories: {
    description:
      'Search community stories and case studies — real experiences from Maranguka, Don Dale, Bourke, and other youth justice programs. 50 verified stories.',
    inputSchema: z.object({
      query: z.string().optional().describe('Search keyword (e.g. "Maranguka", "Don Dale", "lived experience")'),
      story_type: z.enum(['case_study', 'community_voice']).optional().describe('Filter by story type'),
      limit: z.number().min(1).max(20).default(10),
    }),
    execute: async ({ query, story_type, limit }: { query?: string; story_type?: string; limit: number }) => {
      const supabase = createServiceClient();
      let q = supabase
        .from('alma_stories')
        .select('id, title, summary, story_type, impact_areas, story_date, featured');

      if (query) { const s = sanitize(query); q = q.or(`title.ilike.%${s}%,summary.ilike.%${s}%`); }
      if (story_type) q = q.eq('story_type', story_type);

      const { data, error } = await q.order('featured', { ascending: false }).limit(limit);
      if (error) return { error: error.message };
      return { stories: data || [], count: data?.length || 0 };
    },
  },

  search_organizations: {
    description:
      'Search organizations working in youth justice — 556 JusticeHub orgs + 64,560 ACNC charities. Can find ABN, revenue, sector classification.',
    inputSchema: z.object({
      query: z.string().describe('Organization name or keyword'),
      limit: z.number().min(1).max(20).default(10),
    }),
    execute: async ({ query, limit }: { query: string; limit: number }) => {
      const supabase = createServiceClient();
      const s = sanitize(query);

      // Search JH orgs first (richer data), then ACNC charities
      const [orgsResult, orgsCount, acncResult] = await Promise.all([
        supabase
          .from('organizations')
          .select('id, name, slug, description, abn, website')
          .or(`name.ilike.%${s}%,description.ilike.%${s}%`)
          .limit(limit),
        supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .or(`name.ilike.%${s}%,description.ilike.%${s}%`),
        supabase
          .from('acnc_charities')
          .select('abn, charity_name, state, charity_size, activities_description')
          .ilike('charity_name', `%${s}%`)
          .limit(5),
      ]);

      return {
        organizations: orgsResult.data || [],
        charities: acncResult.data || [],
        total_matches: (orgsCount.count || 0) + (acncResult.data?.length || 0),
        showing: (orgsResult.data?.length || 0) + (acncResult.data?.length || 0),
        note: 'Organizations with a slug have a JusticeHub profile page at /organizations/{slug}',
      };
    },
  },

  search_foundations: {
    description:
      'Search philanthropic foundations and their giving patterns — 10,779 foundations with annual giving, thematic focus, and grant sizes. Powered by GrantScope data.',
    inputSchema: z.object({
      query: z.string().optional().describe('Foundation name or keyword'),
      focus: z.string().optional().describe('Thematic focus (e.g. "indigenous", "youth", "justice", "education", "health")'),
      state: z.enum(STATES).optional().describe('State focus'),
      limit: z.number().min(1).max(20).default(10),
    }),
    execute: async ({ query, focus, state: rawState, limit }: { query?: string; focus?: string; state?: string; limit: number }) => {
      const supabase = createServiceClient();
      let q = supabase
        .from('foundations')
        .select('name, total_giving_annual, avg_grant_size, thematic_focus, geographic_focus, giving_philosophy, website, open_programs')
        .order('total_giving_annual', { ascending: false, nullsFirst: false });

      if (query) { const s = sanitize(query); q = q.or(`name.ilike.%${s}%,giving_philosophy.ilike.%${s}%`); }
      if (focus) q = q.contains('thematic_focus', [sanitize(focus)]);
      if (rawState) q = q.contains('geographic_focus', [`AU-${rawState.toUpperCase()}`]);

      const { data, error } = await q.limit(limit);
      if (error) return { error: error.message };

      const formatted = (data || []).map((f: Record<string, unknown>) => ({
        ...f,
        total_giving_annual: f.total_giving_annual ? `$${(Number(f.total_giving_annual) / 1_000_000).toFixed(1)}M` : null,
        avg_grant_size: f.avg_grant_size ? `$${Number(f.avg_grant_size).toLocaleString()}` : null,
      }));

      return { foundations: formatted, count: formatted.length };
    },
  },

  search_events: {
    description:
      'Search JusticeHub events including The Contained tour, launches, symposiums, and community gatherings.',
    inputSchema: z.object({
      query: z.string().optional().describe('Event name or keyword (e.g. "Contained", "launch", "symposium")'),
      limit: z.number().min(1).max(20).default(10),
    }),
    execute: async ({ query, limit }: { query?: string; limit: number }) => {
      const supabase = createServiceClient();
      let q = supabase
        .from('events')
        .select('id, title, event_type, start_date, end_date, location_name, location_state, description, registration_url, is_public')
        .eq('is_public', true)
        .order('start_date', { ascending: false });

      if (query) { const s = sanitize(query); q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%`); }

      const { data, error } = await q.limit(limit);
      if (error) return { error: error.message };
      return {
        events: data || [],
        count: data?.length || 0,
        note: 'The Contained is an immersive touring exhibition about youth justice. More at /contained/tour',
      };
    },
  },

  get_coverage_stats: {
    description:
      'Get overall ALMA system coverage statistics — how much data is available across all dimensions.',
    inputSchema: z.object({}),
    execute: async () => {
      const supabase = createServiceClient();

      const [
        { count: interventions },
        { count: evidence },
        { count: stories },
        { count: findings },
        { count: media },
        { count: cases },
        { count: campaigns },
        { count: fundingRecords },
        { count: rogsRows },
        { count: organizations },
        { count: foundations },
        { count: events },
      ] = await Promise.all([
        supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).neq('verification_status', 'ai_generated'),
        supabase.from('alma_evidence').select('*', { count: 'exact', head: true }),
        supabase.from('alma_stories').select('*', { count: 'exact', head: true }),
        supabase.from('alma_research_findings').select('*', { count: 'exact', head: true }),
        supabase.from('alma_media_articles').select('*', { count: 'exact', head: true }),
        supabase.from('justice_matrix_cases').select('*', { count: 'exact', head: true }),
        supabase.from('justice_matrix_campaigns').select('*', { count: 'exact', head: true }),
        supabase.from('justice_funding').select('*', { count: 'exact', head: true }),
        supabase.from('rogs_justice_spending').select('*', { count: 'exact', head: true }),
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('foundations').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_public', true),
      ]);

      return {
        interventions: interventions || 0,
        evidence_items: evidence || 0,
        case_studies: stories || 0,
        research_findings: findings || 0,
        media_articles: media || 0,
        legal_cases: cases || 0,
        campaigns: campaigns || 0,
        funding_records: fundingRecords || 0,
        rogs_data_points: rogsRows || 0,
        organizations: organizations || 0,
        foundations: foundations || 0,
        events: events || 0,
        states_covered: 8,
        source: 'ALMA real-time coverage metrics',
      };
    },
  },

  // ─── Federated Intelligence: GrantScope + Empathy Ledger ──────────────────

  search_entity_relationships: {
    description:
      'Search the GrantScope entity relationship graph — who funds whom, contracts, grants, donations. 145K entities with 1M+ funding flows mapped.',
    inputSchema: z.object({
      org_name: z.string().describe('Organization name to search for'),
      relationship_type: z.string().optional().describe('Filter by type (e.g. "funded", "contracted")'),
      direction: z.enum(['inbound', 'outbound', 'both']).default('both').describe('Funding direction: inbound (who funds them), outbound (who they fund), or both'),
      limit: z.number().min(1).max(20).default(10),
    }),
    execute: async ({ org_name, relationship_type, direction, limit }: { org_name: string; relationship_type?: string; direction: string; limit: number }) => {
      const supabase = createServiceClient();
      const s = sanitize(org_name);

      // Find org and its GS entity link
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, gs_entity_id')
        .ilike('name', `%${s}%`)
        .limit(3);

      const org = orgs?.find((o: Record<string, unknown>) => o.gs_entity_id) || orgs?.[0];
      if (!org) return { error: `No organization found matching "${org_name}"` };
      if (!org.gs_entity_id) return { error: `${org.name} has no GrantScope entity link — no relationship data available`, org_name: org.name };

      const gsId = org.gs_entity_id;
      const relationships: Array<Record<string, unknown>> = [];

      // Inbound: who funds this org
      if (direction === 'inbound' || direction === 'both') {
        let q = supabase
          .from('gs_relationships')
          .select('source_entity_id, relationship_type, amount, year, dataset')
          .eq('target_entity_id', gsId)
          .not('amount', 'is', null)
          .order('amount', { ascending: false })
          .limit(limit);
        if (relationship_type) q = q.eq('relationship_type', sanitize(relationship_type));
        const { data: inbound } = await q;

        if (inbound?.length) {
          const sourceIds = inbound.map((r: Record<string, unknown>) => r.source_entity_id);
          const { data: entities } = await supabase.from('gs_entities').select('id, canonical_name').in('id', sourceIds);
          const nameMap: Record<string, string> = {};
          for (const e of (entities || [])) nameMap[e.id] = e.canonical_name;

          for (const r of inbound) {
            relationships.push({
              direction: 'inbound',
              source: nameMap[r.source_entity_id as string] || 'Unknown',
              target: org.name,
              type: r.relationship_type,
              amount: r.amount ? `$${(Number(r.amount) / 1_000_000).toFixed(2)}M` : null,
              amount_raw: r.amount,
              year: r.year,
              dataset: r.dataset,
            });
          }
        }
      }

      // Outbound: who this org funds
      if (direction === 'outbound' || direction === 'both') {
        let q = supabase
          .from('gs_relationships')
          .select('target_entity_id, relationship_type, amount, year, dataset')
          .eq('source_entity_id', gsId)
          .not('amount', 'is', null)
          .order('amount', { ascending: false })
          .limit(limit);
        if (relationship_type) q = q.eq('relationship_type', sanitize(relationship_type));
        const { data: outbound } = await q;

        if (outbound?.length) {
          const targetIds = outbound.map((r: Record<string, unknown>) => r.target_entity_id);
          const { data: entities } = await supabase.from('gs_entities').select('id, canonical_name').in('id', targetIds);
          const nameMap: Record<string, string> = {};
          for (const e of (entities || [])) nameMap[e.id] = e.canonical_name;

          for (const r of outbound) {
            relationships.push({
              direction: 'outbound',
              source: org.name,
              target: nameMap[r.target_entity_id as string] || 'Unknown',
              type: r.relationship_type,
              amount: r.amount ? `$${(Number(r.amount) / 1_000_000).toFixed(2)}M` : null,
              amount_raw: r.amount,
              year: r.year,
              dataset: r.dataset,
            });
          }
        }
      }

      const totalAmount = relationships.reduce((sum, r) => sum + (Number(r.amount_raw) || 0), 0);
      return {
        org_name: org.name,
        relationships,
        count: relationships.length,
        total_amount: totalAmount ? `$${(totalAmount / 1_000_000).toFixed(1)}M` : '$0',
        source: 'GrantScope entity relationship graph',
      };
    },
  },

  search_community_voices: {
    description:
      'Search community storytellers and their voices from the Empathy Ledger — real people sharing real experiences of the justice system. 226 storytellers with transcripts and quotes.',
    inputSchema: z.object({
      query: z.string().optional().describe('Search by name, role, or keyword'),
      limit: z.number().min(1).max(20).default(10),
    }),
    execute: async ({ query, limit }: { query?: string; limit: number }) => {
      if (!isV2Configured) {
        return { error: 'Empathy Ledger v2 API not configured', storytellers: [], count: 0 };
      }

      try {
        const storytellerRes = await getStorytellers({ limit: 50 });
        let storytellers = storytellerRes.data || [];

        // Filter by query if provided
        if (query) {
          const q = query.toLowerCase();
          storytellers = storytellers.filter(
            (st) =>
              st.displayName?.toLowerCase().includes(q) ||
              st.role?.toLowerCase().includes(q) ||
              st.bio?.toLowerCase().includes(q) ||
              st.culturalBackground?.some((c) => c.toLowerCase().includes(q))
          );
        }

        storytellers = storytellers.slice(0, limit);

        // Fetch transcripts for matched storytellers (up to 5 to control response size)
        const withQuotes = await Promise.all(
          storytellers.slice(0, 5).map(async (st) => {
            try {
              const transcriptRes = await getTranscripts({ storytellerId: st.id, limit: 3 });
              const quotes = (transcriptRes.data || [])
                .filter((t) => t.content)
                .map((t) => ({
                  title: t.title,
                  excerpt: t.content ? t.content.slice(0, 300) + (t.content.length > 300 ? '...' : '') : null,
                  hasVideo: t.hasVideo,
                }));
              return {
                name: st.displayName,
                role: st.role,
                bio: st.bio,
                culturalBackground: st.culturalBackground,
                location: st.location,
                isElder: st.isElder,
                storyCount: st.storyCount,
                quotes,
              };
            } catch {
              return {
                name: st.displayName,
                role: st.role,
                bio: st.bio,
                culturalBackground: st.culturalBackground,
                location: st.location,
                isElder: st.isElder,
                storyCount: st.storyCount,
                quotes: [],
              };
            }
          })
        );

        return {
          storytellers: withQuotes,
          count: withQuotes.length,
          total_available: storytellerRes.pagination?.total || storytellers.length,
          note: 'These are real voices from community members. Cite with respect and cultural sensitivity.',
          source: 'Empathy Ledger Community Voices',
        };
      } catch (err) {
        return { error: `Failed to fetch community voices: ${err instanceof Error ? err.message : String(err)}`, storytellers: [], count: 0 };
      }
    },
  },

  search_real_photos: {
    description:
      'Search real photographs from affected communities via the Empathy Ledger — NOT AI-generated. Use for campaigns, content, and visual storytelling.',
    inputSchema: z.object({
      query: z.string().optional().describe('Search by caption, description, or cultural tag'),
      gallery_id: z.string().optional().describe('Filter by gallery ID'),
      limit: z.number().min(1).max(50).default(20),
    }),
    execute: async ({ query, gallery_id, limit }: { query?: string; gallery_id?: string; limit: number }) => {
      if (!isV2Configured) {
        return { error: 'Empathy Ledger v2 API not configured', photos: [], count: 0 };
      }

      try {
        const mediaRes = await getMedia({
          limit,
          galleryId: gallery_id,
          type: 'image',
        });

        let photos = (mediaRes.data || []).filter((m) => m.url);

        // Filter by query if provided
        if (query) {
          const q = query.toLowerCase();
          photos = photos.filter(
            (p) =>
              p.title?.toLowerCase().includes(q) ||
              p.description?.toLowerCase().includes(q) ||
              p.altText?.toLowerCase().includes(q) ||
              p.culturalTags?.some((t) => t.toLowerCase().includes(q)) ||
              p.galleryCaption?.toLowerCase().includes(q)
          );
        }

        const formatted = photos.map((p) => ({
          url: p.url,
          thumbnail: p.thumbnailUrl || p.previewUrl,
          caption: p.galleryCaption || p.title || p.description,
          alt_text: p.altText,
          cultural_tags: p.culturalTags,
          cultural_level: p.culturalLevel,
          location: p.location,
          gallery_id: p.galleryId,
          dimensions: p.dimensions,
        }));

        return {
          photos: formatted,
          count: formatted.length,
          total_available: mediaRes.pagination?.total || 0,
          note: 'These are real photographs from community — not AI-generated. Credit and cultural protocols apply.',
          source: 'Empathy Ledger Media Library',
        };
      } catch (err) {
        return { error: `Failed to fetch photos: ${err instanceof Error ? err.message : String(err)}`, photos: [], count: 0 };
      }
    },
  },

  search_org_intelligence: {
    description:
      'Get deep intelligence on an organization — financials, who funds them, who they fund, SEIFA scores, sector classification. Combines JusticeHub org data with GrantScope entity graph.',
    inputSchema: z.object({
      org_name: z.string().describe('Organization name to look up'),
    }),
    execute: async ({ org_name }: { org_name: string }) => {
      const supabase = createServiceClient();
      const s = sanitize(org_name);

      // Find org
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, slug, description, abn, website, state, is_indigenous_org, gs_entity_id')
        .ilike('name', `%${s}%`)
        .limit(3);

      if (!orgs?.length) return { error: `No organization found matching "${org_name}"` };
      const org = orgs[0];

      // Base profile
      const profile: Record<string, unknown> = {
        name: org.name,
        slug: org.slug,
        description: org.description,
        abn: org.abn,
        website: org.website,
        state: org.state,
        is_indigenous_org: org.is_indigenous_org,
        justicehub_url: org.slug ? `/organizations/${org.slug}` : null,
      };

      // If GS-linked, get deep enrichment
      if (org.gs_entity_id) {
        try {
          const enrichment = await getEntityEnrichment(org.gs_entity_id);
          if (enrichment) {
            profile.entity_type = enrichment.entityType;
            profile.sector = enrichment.sector;
            profile.sub_sector = enrichment.subSector;
            profile.seifa_decile = enrichment.seifaDecile;
            profile.remoteness = enrichment.remoteness;
            profile.is_community_controlled = enrichment.isCommunityControlled;
            profile.latest_revenue = enrichment.latestRevenue ? `$${(enrichment.latestRevenue / 1_000_000).toFixed(1)}M` : null;
            profile.latest_assets = enrichment.latestAssets ? `$${(enrichment.latestAssets / 1_000_000).toFixed(1)}M` : null;
            profile.financial_year = enrichment.financialYear;
            profile.lga = enrichment.lgaName;
            profile.source_datasets = enrichment.sourceDatasets;
            profile.relationships = enrichment.relationshipSummary;
            if (enrichment.relationshipSummary.topFundingSources.length) {
              profile.top_funding_sources = enrichment.relationshipSummary.topFundingSources.map((f) => ({
                name: f.name,
                amount: `$${(f.amount / 1_000_000).toFixed(2)}M`,
                year: f.year,
              }));
            }
            if (enrichment.relationshipSummary.topFundingTargets.length) {
              profile.top_funding_targets = enrichment.relationshipSummary.topFundingTargets.map((f) => ({
                name: f.name,
                amount: `$${(f.amount / 1_000_000).toFixed(2)}M`,
                year: f.year,
              }));
            }
          }
        } catch {
          profile.enrichment_error = 'Failed to fetch GrantScope enrichment';
        }
      } else {
        profile.note = 'This organization is not linked to the GrantScope entity graph — financial and relationship data unavailable.';
      }

      return {
        profile,
        source: org.gs_entity_id ? 'JusticeHub + GrantScope Entity Graph' : 'JusticeHub',
      };
    },
  },
};
