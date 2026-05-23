import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * Data-sufficiency research agent.
 *
 * For each open data_gap_question (up to ?batch=N), the agent:
 *   1. Constructs a search query from the question + proposed_source_url hint
 *   2. Searches via Serper (or Brave / Jina fallback) for ~5 candidate URLs
 *   3. Asks Gemini Flash to rank each candidate by relevance with a rationale
 *   4. Inserts ranked candidates into data_agent_findings (idempotent on URL+gap)
 *
 * Admin reviews via /admin/data-sufficiency/findings — accepts spawn a new
 * row in data_sources_inventory or update the gap question's
 * proposed_source_url.
 *
 * Auth: CRON_SECRET in Authorization header. Manual triggers from admin can
 * pass &gap_id=X to target a single question (still PIN-gated via secret).
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

interface SearchResult {
  url: string;
  title?: string;
  snippet?: string;
}

async function serperSearch(q: string, limit: number = 5): Promise<SearchResult[]> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': key },
      body: JSON.stringify({ q, num: limit, gl: 'au' }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.organic || []).slice(0, limit).map((r: any) => ({
      url: r.link,
      title: r.title,
      snippet: r.snippet,
    }));
  } catch {
    return [];
  }
}

async function rankCandidates(
  question: string,
  topic: string,
  candidates: SearchResult[],
  geminiKey: string
): Promise<Array<{ url: string; title: string; relevance: number; summary: string; rationale: string }>> {
  if (candidates.length === 0) return [];
  const userPrompt = `Data gap question: "${question}"
Topic: ${topic}

For each candidate URL, judge whether it's a credible source that could close the data gap.
Score 0-1 (1 = closes the gap perfectly). Output JSON array, one object per candidate, in the same order:
{ "url": string, "title": string, "relevance": number, "summary": string (one-sentence what's there), "rationale": string (why this fits / doesn't fit the gap) }

Candidates:
${candidates.map((c, i) => `${i + 1}. ${c.title || 'untitled'} — ${c.url}\n   ${c.snippet || ''}`).join('\n\n')}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p?.url && typeof p.relevance === 'number')
      .map((p) => ({
        url: p.url,
        title: p.title || candidates.find((c) => c.url === p.url)?.title || '',
        relevance: p.relevance,
        summary: p.summary || '',
        rationale: p.rationale || '',
      }));
  } catch {
    return [];
  }
}

function buildSearchQuery(question: string, hintUrl: string | null): string {
  // If the hint URL is a top-level domain, lean on that as a site:filter
  let q = question;
  if (hintUrl) {
    try {
      const u = new URL(hintUrl);
      q = `${q} site:${u.hostname.replace(/^www\./, '')} OR ${q}`;
    } catch {
      // ignore malformed URL
    }
  }
  return `${q} youth justice Australia dataset OR register OR report`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const geminiKey = process.env.GEMINI_API_KEY;
  const serperKey = process.env.SERPER_API_KEY;
  if (!geminiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 });
  if (!serperKey) return NextResponse.json({ error: 'SERPER_API_KEY not configured' }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const batch = Math.min(Math.max(parseInt(searchParams.get('batch') || '5', 10), 1), 20);
  const targetGapId = searchParams.get('gap_id');

  const supabase = createServiceClient() as any;
  let q = supabase
    .from('data_gap_questions')
    .select('id, question, topic, proposed_source_url, priority, status')
    .in('status', ['open', 'investigating'])
    .order('priority')
    .order('raised_at', { ascending: true });
  if (targetGapId) q = q.eq('id', targetGapId);
  else q = q.limit(batch);
  const { data: gaps } = await q;
  if (!gaps || gaps.length === 0) {
    return NextResponse.json({ ok: true, processedGaps: 0, message: 'No open gap questions.' });
  }

  let totalFindings = 0;
  const results: any[] = [];

  for (const gap of gaps) {
    const searchQ = buildSearchQuery(gap.question, gap.proposed_source_url);
    const candidates = await serperSearch(searchQ, 6);
    if (candidates.length === 0) {
      results.push({ gapId: gap.id, candidates: 0, findings: 0 });
      continue;
    }
    const ranked = await rankCandidates(gap.question, gap.topic, candidates, geminiKey);
    // Keep relevance >= 0.4 to filter the noise
    const findings = ranked.filter((r) => r.relevance >= 0.4);
    for (const f of findings) {
      const { error } = await supabase
        .from('data_agent_findings')
        .upsert(
          {
            gap_question_id: gap.id,
            topic: gap.topic,
            candidate_url: f.url,
            candidate_title: f.title,
            summary: f.summary,
            relevance_score: f.relevance,
            rationale: f.rationale,
            search_query: searchQ,
            raw_result: candidates.find((c) => c.url === f.url) || null,
          },
          { onConflict: 'gap_question_id,candidate_url', ignoreDuplicates: true }
        );
      if (!error) totalFindings++;
    }
    results.push({ gapId: gap.id, candidates: candidates.length, findings: findings.length });

    // If we found a high-confidence finding (>=0.7), move the gap to 'investigating'
    if (findings.some((f) => f.relevance >= 0.7) && gap.status === 'open') {
      await supabase.from('data_gap_questions').update({ status: 'investigating' }).eq('id', gap.id);
    }
  }

  return NextResponse.json({
    ok: true,
    processedGaps: gaps.length,
    totalFindings,
    results,
  });
}
