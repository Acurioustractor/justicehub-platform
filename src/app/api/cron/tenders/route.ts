import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { LLMClient } from '@/lib/ai/model-router';
import { parseJSON } from '@/lib/ai/parse-json';
import { searchWeb, type SearchResult } from '@/lib/scraping/web-search';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

const JUSTICE_KEYWORDS = [
  'youth justice', 'juvenile justice', 'youth detention', 'corrections',
  'justice services', 'court services', 'legal aid', 'community corrections',
  'diversion program', 'rehabilitation', 'offender management', 'victim support',
  'restorative justice', 'bail support', 'crime prevention', 'child protection',
  'Indigenous justice', 'Aboriginal justice',
];

function classifyJustice(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();
  const matched = JUSTICE_KEYWORDS.filter((kw) => text.includes(kw));
  return { isJustice: matched.length > 0, keywords: matched };
}

const QUERIES = [
  { state: 'QLD', source: 'qld_qtenders', query: 'Queensland government tender youth justice corrections 2026' },
  { state: 'NSW', source: 'nsw_etender', query: 'NSW government tender youth justice corrections 2026' },
  { state: 'VIC', source: 'vic_buying', query: 'Victoria government tender youth justice corrections 2026' },
];

/**
 * Cron: Scrape state procurement portals for justice-related tenders.
 * Runs one state per invocation (rotates QLD → NSW → VIC).
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const results = { found: 0, inserted: 0, skipped: 0, errors: [] as string[] };

  // Rotate: pick the state with oldest/fewest tenders
  const { data: stateCounts } = await supabase
    .from('state_tenders')
    .select('state');
  const counts: Record<string, number> = {};
  for (const row of stateCounts || []) {
    counts[row.state] = (counts[row.state] || 0) + 1;
  }
  // Pick state with fewest tenders
  const sortedQueries = [...QUERIES].sort(
    (a, b) => (counts[a.state] || 0) - (counts[b.state] || 0)
  );
  const target = sortedQueries[0];

  // Search for tenders via Jina
  const searchResults = await searchWeb(target.query);
  results.found = searchResults.length;

  if (searchResults.length === 0) {
    return NextResponse.json({ success: true, state: target.state, results });
  }

  // Extract tender data via LLM
  const prompt = `You are an Australian government procurement analyst. From these search results about ${target.state} justice-related government tenders, extract structured tender information.

For each actual tender/contract/RFT found, extract:
- source_id: Reference number if visible (or null)
- title: Full title
- description: 1-2 sentence description
- contract_value: Dollar amount if shown (number only)
- status: "open", "closed", or "awarded"
- buyer_name: Government agency
- supplier_name: Supplier if awarded (null otherwise)
- source_url: URL to the tender page

SEARCH RESULTS:
${searchResults.map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.description}`).join('\n\n')}

Return JSON: { "tenders": [{ "source_id": null, "title": "...", "description": "...", "contract_value": null, "status": "open", "buyer_name": "...", "supplier_name": null, "source_url": "..." }] }

Only include actual tenders. Return {"tenders": []} if none found.`;

  try {
    const raw = await LLMClient.getInstance().call(prompt, { maxTokens: 2000 });
    const parsed = parseJSON(raw);
    if (!parsed?.tenders) {
      return NextResponse.json({ success: true, state: target.state, results });
    }

    for (const tender of parsed.tenders as { source_id?: string; title?: string; description?: string; contract_value?: number; status?: string; buyer_name?: string; supplier_name?: string; source_url?: string }[]) {
      if (!tender.title) continue;

      const { isJustice, keywords } = classifyJustice(tender.title || '', tender.description || '');

      const record = {
        source: target.source,
        source_id: tender.source_id || `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title: tender.title,
        description: tender.description,
        contract_value: tender.contract_value ? Number(tender.contract_value) : null,
        status: tender.status || 'unknown',
        state: target.state,
        buyer_name: tender.buyer_name,
        supplier_name: tender.supplier_name,
        is_justice_related: isJustice,
        justice_keywords: keywords,
        source_url: tender.source_url,
      };

      const { error } = await supabase.from('state_tenders').upsert(record, {
        onConflict: 'source,source_id',
      });

      if (error) {
        results.errors.push(`${tender.title}: ${error.message}`);
        results.skipped++;
      } else {
        results.inserted++;
      }
    }
  } catch (err) {
    results.errors.push(err instanceof Error ? err.message : String(err));
  }

  // Get total counts
  const { count } = await supabase
    .from('state_tenders')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json({
    success: results.errors.length === 0,
    state: target.state,
    results,
    total_tenders: count,
    timestamp: new Date().toISOString(),
  });
}
