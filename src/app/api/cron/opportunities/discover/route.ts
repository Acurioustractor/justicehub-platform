import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { callBackgroundLLM } from '@/lib/ai/model-router';
import { parseJSON } from '@/lib/ai/parse-json';
import { validateLLMOutput } from '@/lib/ai/llm-schemas';
import { searchWeb } from '@/lib/scraping/web-search';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const YouthOpportunitySchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  category: z.enum([
    'art_prize',
    'music',
    'grant',
    'competition',
    'workshop',
    'scholarship',
    'mentorship',
    'other',
  ]),
  organizer: z.string().optional(),
  source_url: z.string().url(),
  application_url: z.string().url().optional().nullable(),
  deadline: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  location_name: z.string().optional().nullable(),
  location_state: z.string().optional().nullable(),
  is_national: z.boolean().optional(),
  age_min: z.number().optional().nullable(),
  age_max: z.number().optional().nullable(),
  prize_amount: z.number().optional().nullable(),
  eligibility_notes: z.string().optional().nullable(),
  relevance_score: z.number().min(0).max(1),
});

const DiscoveryResponseSchema = z.object({
  opportunities: z.array(YouthOpportunitySchema),
});

// ---------------------------------------------------------------------------
// Search queries — rotated daily to cover breadth
// ---------------------------------------------------------------------------

const SEARCH_QUERIES = [
  // Art
  'youth art prize Australia 2026 open applications',
  'young artist competition Australia submissions open',
  'Indigenous youth art award Australia',
  'teen art exhibition call for entries Australia',
  // Music
  'youth music competition Australia 2026',
  'young musician award Australia open now',
  'Indigenous music program youth Australia',
  'battle of the bands youth Australia',
  // Grants for young people directly
  'youth grant Australia 2026 applications open',
  'young people grant funding Australia',
  'First Nations youth scholarship Australia',
  'youth leadership program Australia applications',
  // Competitions & workshops
  'youth writing competition Australia 2026',
  'youth film competition Australia',
  'STEM competition young people Australia',
  'youth entrepreneurship program Australia',
  // State arts councils
  'Create NSW youth arts funding',
  'Creative Victoria young people grants',
  'Arts Queensland youth program',
  'Country Arts SA youth opportunity',
  // State youth departments
  'Queensland youth development grants',
  'NSW youth opportunities grants 2026',
  'Victorian youth programs applications open',
];

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const batch = Math.min(
    6,
    Math.max(1, Number(request.nextUrl.searchParams.get('batch') || '3'))
  );

  return runDiscovery(batch);
}

async function runDiscovery(batchSize: number) {
  const supabase = createServiceClient() as any;
  const stats = {
    queries_searched: 0,
    opportunities_found: 0,
    duplicates_skipped: 0,
    expired_closed: 0,
    errors: [] as string[],
  };

  try {
    // Get existing URLs for dedup
    const { data: existing } = await supabase
      .from('youth_opportunities')
      .select('source_url');
    const existingUrls = new Set(
      (existing || []).map((e: any) => e.source_url).filter(Boolean)
    );

    // Also expire any past-deadline opportunities
    const now = new Date().toISOString();
    const { count: expiredCount } = await supabase
      .from('youth_opportunities')
      .update({ status: 'expired', updated_at: now })
      .eq('status', 'open')
      .lt('deadline', now)
      .select('id', { count: 'exact', head: true });
    stats.expired_closed = expiredCount || 0;

    // Pick a rotating subset of queries based on day
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
        86400000
    );
    const startIdx = (dayOfYear * batchSize) % SEARCH_QUERIES.length;
    const queries: string[] = [];
    for (let i = 0; i < batchSize; i++) {
      queries.push(SEARCH_QUERIES[(startIdx + i) % SEARCH_QUERIES.length]);
    }

    for (const query of queries) {
      stats.queries_searched++;
      try {
        const searchResults = await searchWeb(query, 8);
        const newResults = searchResults.filter(
          (r) => r.url && !existingUrls.has(r.url)
        );

        if (newResults.length === 0) {
          stats.duplicates_skipped++;
          continue;
        }

        const prompt = buildPrompt(newResults, query);
        const raw = await callBackgroundLLM(prompt, { maxTokens: 3000 });
        const parsed = parseJSON<unknown>(raw);
        const validated = validateLLMOutput(parsed, DiscoveryResponseSchema);

        if (!validated.success) {
          stats.errors.push(
            `"${query.slice(0, 40)}": schema error — ${validated.errors.slice(0, 2).join('; ')}`
          );
          continue;
        }

        for (const opp of validated.data.opportunities) {
          if (!opp.source_url || !opp.title) continue;
          if ((opp.relevance_score || 0) < 0.5) continue;
          if (existingUrls.has(opp.source_url)) {
            stats.duplicates_skipped++;
            continue;
          }

          // Parse deadline — skip if already past
          let deadline: string | null = null;
          if (opp.deadline) {
            try {
              const d = new Date(opp.deadline);
              if (!isNaN(d.getTime())) {
                if (d < new Date()) continue; // already expired
                deadline = d.toISOString();
              }
            } catch {
              // ignore bad dates
            }
          }

          const row = {
            title: opp.title.slice(0, 300),
            description: opp.description?.slice(0, 2000) || null,
            category: opp.category,
            organizer: opp.organizer?.slice(0, 200) || null,
            source_url: opp.source_url,
            application_url: opp.application_url || null,
            deadline,
            start_date: opp.start_date ? tryParseDate(opp.start_date) : null,
            end_date: opp.end_date ? tryParseDate(opp.end_date) : null,
            location_name: opp.location_name || null,
            location_state: opp.location_state || null,
            is_national: opp.is_national ?? false,
            age_min: opp.age_min ?? null,
            age_max: opp.age_max ?? null,
            prize_amount: opp.prize_amount ?? null,
            eligibility_notes: opp.eligibility_notes?.slice(0, 1000) || null,
            keywords: extractKeywords(query),
            scrape_source: 'cron_discover',
            scraped_at: now,
            status: 'open',
          };

          const { error } = await supabase
            .from('youth_opportunities')
            .upsert(row, { onConflict: 'source_url' });

          if (error) {
            stats.errors.push(`Insert "${opp.title.slice(0, 30)}": ${error.message}`);
          } else {
            stats.opportunities_found++;
            existingUrls.add(opp.source_url);
          }
        }
      } catch (err: any) {
        stats.errors.push(`"${query.slice(0, 40)}": ${err.message?.slice(0, 100)}`);
      }
    }
  } catch (err: any) {
    stats.errors.push(`Fatal: ${err.message?.slice(0, 200)}`);
  }

  console.log('[OpportunityDiscover]', JSON.stringify(stats));
  return NextResponse.json(stats);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tryParseDate(s: string): string | null {
  try {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

function extractKeywords(query: string): string[] {
  const stopwords = new Set([
    'australia', 'open', 'applications', 'now', '2026', '2025',
    'for', 'the', 'and', 'young', 'people',
  ]);
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w))
    .slice(0, 5);
}

function buildPrompt(
  searchResults: Array<{ title: string; url: string; description: string }>,
  query: string
): string {
  const resultsText = searchResults
    .map((r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.description}`)
    .join('\n\n');

  return `You are extracting youth opportunities from search results. Today is ${new Date().toISOString().slice(0, 10)}.

Search query: "${query}"

Search results:
${resultsText}

Extract ONLY genuine, currently-open opportunities for young people (roughly ages 12-30) in Australia. Include:
- Art prizes, exhibitions, competitions
- Music competitions, battle of the bands, showcases
- Grants or scholarships for young people directly (not org-level grants)
- Writing, film, STEM competitions
- Youth leadership/mentorship programs
- Workshops with open applications

EXCLUDE:
- News articles about past events
- Org-level funding/grants (these go elsewhere)
- Opportunities that have clearly closed
- Results from other countries
- General program descriptions without specific open applications

For each opportunity, provide:
- title: Clear name of the opportunity
- description: 1-2 sentence summary
- category: one of art_prize, music, grant, competition, workshop, scholarship, mentorship, other
- organizer: Who runs it
- source_url: The URL from the search results
- application_url: Direct link to apply (if different from source_url, else null)
- deadline: ISO date string if found (e.g. "2026-06-30"), null if unknown
- start_date, end_date: If it's a dated event
- location_name, location_state: Where (use 2-letter state codes: QLD, NSW, VIC, etc.)
- is_national: true if Australia-wide
- age_min, age_max: Age range if specified
- prize_amount: Dollar value if mentioned
- eligibility_notes: Any key eligibility criteria
- relevance_score: 0-1, how relevant and real this opportunity is (0.8+ = clearly real and open)

Return JSON: { "opportunities": [...] }
If no valid opportunities found, return { "opportunities": [] }`;
}
