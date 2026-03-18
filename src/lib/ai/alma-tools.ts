/**
 * ALMA Tool Definitions for Agentic Chat
 *
 * 13 tools the LLM can call to query real data from Supabase.
 * Used with Vercel AI SDK's streamText() tool calling.
 *
 * Column names verified against actual DB schema 2026-03-13.
 */

// AI SDK expects Zod v3 schemas
import { z } from 'zod/v3';
import { createServiceClient } from '@/lib/supabase/service-lite';

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

      const { data, error } = await q.limit(limit);
      if (error) return { error: error.message };

      const totalAmount = (data || []).reduce((sum: number, r: Record<string, unknown>) => sum + (Number(r.amount_dollars) || 0), 0);
      return {
        funding: data || [],
        count: data?.length || 0,
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
      const [orgsResult, acncResult] = await Promise.all([
        supabase
          .from('organizations')
          .select('id, name, slug, description, abn, website')
          .or(`name.ilike.%${s}%,description.ilike.%${s}%`)
          .limit(limit),
        supabase
          .from('acnc_charities')
          .select('abn, charity_name, state, charity_size, activities_description')
          .ilike('charity_name', `%${s}%`)
          .limit(5),
      ]);

      return {
        organizations: orgsResult.data || [],
        charities: acncResult.data || [],
        total: (orgsResult.data?.length || 0) + (acncResult.data?.length || 0),
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
};
