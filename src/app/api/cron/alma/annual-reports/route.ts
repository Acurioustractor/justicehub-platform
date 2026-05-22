import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

// Mirrors scripts/alma-extract-annual-reports.mjs. Keep in sync.

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 30_000;

const PROVIDERS = [
  {
    name: 'cerebras',
    key: process.env.CEREBRAS_API_KEY,
    url: 'https://api.cerebras.ai/v1/chat/completions',
    model: 'qwen-3-235b-a22b-instruct-2507',
  },
  {
    name: 'gemini',
    key: process.env.GEMINI_API_KEY,
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.5-flash',
  },
].filter((p) => p.key);

const EXTRACTION_PROMPT = `You are extracting structured facts from an Australian community organisation's annual report PDF.

Output JSON with these fields. Use null when the report doesn't contain the data — do not invent.

- report_year: integer (e.g. 2024). The year the report covers (not the year published).
- people_served: object with { number: integer, definition: string }
- top_outcomes: array of up to 5 strings — concrete outcomes claimed, with numbers when stated
- funders: array of organisation names
- board_members: array of strings
- programs: array of strings
- revenue_aud: integer
- expenditure_aud: integer
- staff_count: integer
- volunteers_count: integer
- cultural_indicators: array of strings — Indigenous-led status, on-Country work, Elder governance signals
- notes: string

Return ONLY JSON, no prose.`;

async function callLLM(prompt: string, userContent: string) {
  for (const provider of PROVIDERS) {
    try {
      const res = await fetch(provider.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.key}` },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: userContent },
          ],
          temperature: 0,
          response_format: { type: 'json_object' },
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) continue;
      try {
        return { provider: provider.name, model: provider.model, json: JSON.parse(text) };
      } catch {
        const m = text.match(/\{[\s\S]+\}/);
        if (m) return { provider: provider.name, model: provider.model, json: JSON.parse(m[0]) };
      }
    } catch {
      // fall through to next provider
    }
  }
  return null;
}

function findAnnualReportPdfLink(html: string, baseUrl: string): string | null {
  const linkRe = /<a\b[^>]*href=["']([^"']+\.pdf[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const candidates: { url: string; year: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) !== null) {
    const rawHref = m[1].trim();
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const hay = `${rawHref} ${text}`.toLowerCase();
    if (!/annual|report|impact|year[\s-]?in[\s-]?review/.test(hay)) continue;
    const yearMatch = hay.match(/20\d{2}/g);
    const year = yearMatch ? Math.max(...yearMatch.map(Number)) : 0;
    try {
      candidates.push({ url: new URL(rawHref, baseUrl).toString(), year });
    } catch {
      continue;
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.year - a.year);
  return candidates[0].url;
}

async function fetchPdf(
  url: string,
  opts: { allowLandingPageCrawl?: boolean } = {}
): Promise<{ ok: boolean; buffer?: Buffer; reason?: string }> {
  const { allowLandingPageCrawl = true } = opts;
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent': 'JusticeHubMapBot/1.0 (+https://justicehub.com.au)',
        Accept: 'application/pdf,text/html,*/*',
      },
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('text/html')) {
      if (!allowLandingPageCrawl) return { ok: false, reason: 'html_not_pdf' };
      const html = await res.text();
      const discovered = findAnnualReportPdfLink(html, res.url || url);
      if (!discovered) return { ok: false, reason: 'html_no_pdf_links_found' };
      return fetchPdf(discovered, { allowLandingPageCrawl: false });
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_PDF_BYTES) return { ok: false, reason: `too_large:${buf.length}` };
    if (buf.slice(0, 4).toString() !== '%PDF') return { ok: false, reason: 'not_a_pdf_file' };
    return { ok: true, buffer: buf };
  } catch (e: any) {
    return { ok: false, reason: `fetch_failed: ${e?.message || 'unknown'}` };
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const mod: any = await import('pdf-parse');
    const PDFParse = mod.PDFParse || mod.default?.PDFParse;
    if (!PDFParse) return '';
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result?.text || '';
  } catch {
    return '';
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (PROVIDERS.length === 0) {
    return NextResponse.json({ error: 'no_llm_keys' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const batch = Math.min(parseInt(searchParams.get('batch') || '8', 10), 15);

  const supabase = createServiceClient() as any;

  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, name, slug, annual_report_url, acnc_data')
    .not('annual_report_url', 'is', null)
    .neq('archived', true)
    .order('profile_completeness_score', { ascending: false, nullsFirst: false })
    .limit(batch * 3);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const eligible = (orgs || [])
    .filter((o: any) => !o.acnc_data?.annual_report_facts)
    .slice(0, batch);

  if (eligible.length === 0) {
    return NextResponse.json({ extracted: 0, reason: 'nothing_eligible' });
  }

  let extracted = 0;
  let skipped = 0;
  const samples: Array<{ name: string; year?: number; people_served?: number }> = [];

  for (const org of eligible) {
    const pdf = await fetchPdf(org.annual_report_url);
    if (!pdf.ok || !pdf.buffer) {
      skipped++;
      const existing = org.acnc_data || {};
      await supabase
        .from('organizations')
        .update({
          acnc_data: {
            ...existing,
            annual_report_extraction_failed: {
              reason: pdf.reason,
              attempted_at: new Date().toISOString(),
            },
          },
        })
        .eq('id', org.id);
      continue;
    }
    const text = await extractPdfText(pdf.buffer);
    if (!text || text.length < 500) {
      skipped++;
      continue;
    }
    const llm = await callLLM(
      EXTRACTION_PROMPT,
      `Organisation: ${org.name}\nReport URL: ${org.annual_report_url}\n\nReport text:\n${text.slice(0, 40_000)}`
    );
    if (!llm) {
      skipped++;
      continue;
    }
    const facts = {
      ...llm.json,
      extracted_at: new Date().toISOString(),
      extractor: { provider: llm.provider, model: llm.model },
      source_pdf_bytes: pdf.buffer.length,
    };
    const { error: updErr } = await supabase
      .from('organizations')
      .update({
        acnc_data: {
          ...(org.acnc_data || {}),
          annual_report_facts: facts,
        },
      })
      .eq('id', org.id);
    if (updErr) {
      skipped++;
      continue;
    }
    extracted++;
    if (samples.length < 8) {
      samples.push({
        name: org.name,
        year: facts.report_year,
        people_served: facts.people_served?.number,
      });
    }
    // Be polite to the source server between PDFs.
    await new Promise((r) => setTimeout(r, 1500));
  }

  return NextResponse.json({ extracted, skipped, eligible: eligible.length, samples });
}
