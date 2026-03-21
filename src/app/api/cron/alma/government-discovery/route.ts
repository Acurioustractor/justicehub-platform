import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
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

const JURISDICTIONS = ['QLD', 'NSW', 'VIC', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'Federal'] as const;

const STATE_SEARCH_SITES: Record<string, string[]> = {
  QLD: ['statements.qld.gov.au', 'qld.gov.au'],
  NSW: ['nsw.gov.au', 'dcj.nsw.gov.au'],
  VIC: ['premier.vic.gov.au', 'justice.vic.gov.au'],
  WA: ['wa.gov.au', 'justice.wa.gov.au'],
  SA: ['sa.gov.au', 'dhs.sa.gov.au'],
  TAS: ['justice.tas.gov.au', 'premier.tas.gov.au'],
  ACT: ['act.gov.au'],
  NT: ['nt.gov.au'],
  Federal: ['minister.ag.gov.au', 'ministers.pmc.gov.au', 'niaa.gov.au'],
};

async function callLLM(prompt: string, systemPrompt: string): Promise<string> {
  const providers = [
    { name: 'groq', key: process.env.GROQ_API_KEY, url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile' },
    { name: 'gemini', key: process.env.GEMINI_API_KEY, url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', model: 'gemini-2.5-flash' },
  ];

  for (const p of providers) {
    if (!p.key) continue;
    try {
      const res = await fetch(p.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key}` },
        body: JSON.stringify({
          model: p.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          max_tokens: 3000,
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const text = (data as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content || '';
      return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    } catch {
      continue;
    }
  }
  throw new Error('All LLM providers failed');
}

function extractJSON(text: string): unknown {
  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/```(?:json|JSON)?\s*\n?/g, '')
    .replace(/```\s*$/gm, '')
    .trim();
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/(\{[\s\S]*\})/);
  if (match) {
    try { return JSON.parse(match[1].replace(/,\s*([}\]])/g, '$1')); } catch {}
  }
  return null;
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: 'text/plain' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.substring(0, 8000);
  } catch {
    return null;
  }
}

/**
 * Government Discovery Cron
 *
 * Rotates through 3 states per run, searches for recent ministerial
 * announcements about youth justice, extracts structured data, inserts
 * into alma_government_programs.
 *
 * GET /api/cron/alma/government-discovery?batch=3
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const batch = Math.min(5, Math.max(1, Number(request.nextUrl.searchParams.get('batch') || '3')));
  const supabase = createServiceClient();

  const results = {
    states_checked: [] as string[],
    programs_discovered: 0,
    duplicates_skipped: 0,
    searches: 0,
    errors: [] as string[],
  };

  try {
    // Rotate states: pick states least recently checked
    // Use a simple counter based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const startIdx = (dayOfYear * batch) % JURISDICTIONS.length;
    const statesToCheck: string[] = [];
    for (let i = 0; i < batch; i++) {
      statesToCheck.push(JURISDICTIONS[(startIdx + i) % JURISDICTIONS.length]);
    }

    for (const state of statesToCheck) {
      results.states_checked.push(state);
      const sites = STATE_SEARCH_SITES[state] || [];
      const siteFilter = sites.map((s) => `site:${s}`).join(' OR ');
      const query = `(${siteFilter}) "youth justice" program announcement 2025 OR 2026`;

      const searchResults = await searchWeb(query, 5);
      results.searches++;

      if (!searchResults.length) continue;

      for (const sr of searchResults.slice(0, 3)) {
        if (sr.url.endsWith('.pdf')) continue;

        const pageText = await fetchPage(sr.url);
        if (!pageText || pageText.length < 200) continue;

        const prompt = `Extract government youth justice program announcements from this page.
Return JSON: {"programs": [...]} where each program has:
- name (string, required, min 3 chars)
- jurisdiction: "${state}"
- program_type: type like "diversion", "therapeutic", "detention", etc.
- announced_date: "YYYY-MM-DD" if mentioned
- budget_amount: number in AUD (multiply millions)
- description: what the program does (min 10 chars)
- minister: name of minister
- department: government department
- target_cohort: ["10-17 year olds", "First Nations youth", etc.]
- status: "announced" | "in_progress" | "implemented" | "abandoned"
- source_url: "${sr.url}"

Only include youth justice / juvenile justice programs. Return {"programs": []} if none.

Page:
${pageText}`;

        try {
          const raw = await callLLM(prompt, 'Extract structured data from Australian government pages about youth justice. Return valid JSON only.');
          const parsed = extractJSON(raw) as { programs?: Array<{
            name?: string; jurisdiction?: string; program_type?: string;
            announced_date?: string; budget_amount?: number; description?: string;
            minister?: string; department?: string; target_cohort?: string[];
            status?: string; source_url?: string;
          }> } | null;
          if (!parsed?.programs?.length) continue;

          for (const prog of parsed.programs) {
            if (!prog.name || prog.name.length < 3) continue;
            if (!prog.description || prog.description.length < 10) continue;

            // Dedup
            const { data: existing } = await supabase
              .from('alma_government_programs')
              .select('id')
              .ilike('name', prog.name)
              .eq('jurisdiction', state)
              .maybeSingle();

            if (existing) {
              results.duplicates_skipped++;
              continue;
            }

            const validStatuses = ['announced', 'in_progress', 'implemented', 'abandoned'];
            const { error } = await supabase.from('alma_government_programs').insert({
              name: prog.name.substring(0, 300),
              jurisdiction: state,
              program_type: prog.program_type || null,
              announced_date: prog.announced_date || null,
              status: validStatuses.includes(prog.status || '') ? prog.status : 'announced',
              budget_amount: prog.budget_amount || null,
              description: (prog.description || '').substring(0, 5000),
              official_url: prog.source_url || sr.url,
              minister: prog.minister || null,
              department: prog.department || null,
              target_cohort: prog.target_cohort || null,
              community_led: false,
            });

            if (error) {
              results.errors.push(`${state}: ${error.message}`);
            } else {
              results.programs_discovered++;
            }
          }
        } catch (e) {
          results.errors.push(`${state} LLM: ${(e as Error).message}`);
        }
      }
    }
  } catch (e) {
    results.errors.push(`Fatal: ${(e as Error).message}`);
  }

  return NextResponse.json(results);
}
