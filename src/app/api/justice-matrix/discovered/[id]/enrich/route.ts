/**
 * POST /api/justice-matrix/discovered/[id]/enrich
 *
 * Deep-fetches the discovery's source URL, asks the LLM to extract the FULL
 * set of fields the approve endpoint accepts, and returns them so the
 * reviewer queue can populate the form. The curator then verifies and clicks
 * "Approve with edits" — no typing from scratch.
 *
 * Admin-only. LLM routed through callBackgroundLLM so any configured
 * provider can serve (no Anthropic hard dependency).
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { checkAdmin } from '@/lib/supabase/admin-lite';
import { callBackgroundLLM } from '@/lib/ai/model-router';
import { parseJSON } from '@/lib/ai/parse-json';
import { validateLLMOutput } from '@/lib/ai/llm-schemas';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CaseEnrichmentSchema = z.object({
  jurisdiction: z.string().nullable().optional(),
  case_citation: z.string().nullable().optional(),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  court: z.string().nullable().optional(),
  strategic_issue: z.string().nullable().optional(),
  key_holding: z.string().nullable().optional(),
  facts: z.string().nullable().optional(),
  reasoning: z.string().nullable().optional(),
  dissents: z.string().nullable().optional(),
  statutes_cited: z.array(z.string()).default([]).nullable().optional(),
  cases_cited: z.array(z.string()).default([]).nullable().optional(),
  judges: z.array(z.string()).default([]).nullable().optional(),
  region: z.string().nullable().optional(),
  country_code: z.string().max(8).nullable().optional(),
  categories: z.array(z.string()).default([]),
  outcome: z.enum(['favorable', 'adverse', 'pending']).nullable().optional(),
  precedent_strength: z.enum(['high', 'medium', 'low']).nullable().optional(),
});

const CampaignEnrichmentSchema = z.object({
  country_region: z.string().nullable().optional(),
  campaign_name: z.string().nullable().optional(),
  lead_organizations: z.string().nullable().optional(),
  goals: z.string().nullable().optional(),
  notable_tactics: z.string().nullable().optional(),
  outcome_status: z.string().nullable().optional(),
  start_year: z.number().int().min(1900).max(2100).nullable().optional(),
  country_code: z.string().max(8).nullable().optional(),
  categories: z.array(z.string()).default([]),
  is_ongoing: z.boolean().nullable().optional(),
});

async function fetchSourceText(url: string): Promise<string> {
  if (!url || url.startsWith('mailto:')) return '';
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!res.ok) return '';
    const html = await res.text();
    // Strip tags + scripts; keep meaningful text. Cap at 30k chars to fit the prompt.
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned.slice(0, 30000);
  } catch {
    return '';
  } finally {
    clearTimeout(t);
  }
}

function casePrompt(opts: {
  title: string;
  jurisdiction: string | null;
  year: number | null;
  summary: string | null;
  sourceUrl: string;
  pageText: string;
}): string {
  return `You are populating a strategic-litigation case profile in a Justice Matrix. Use the source page below and the existing extracted fields to fill EVERY field you can ground in evidence.

Existing extracted fields:
  title: ${opts.title}
  jurisdiction: ${opts.jurisdiction ?? 'unknown'}
  year: ${opts.year ?? 'unknown'}
  summary: ${opts.summary ?? 'unknown'}
  source_url: ${opts.sourceUrl}

Source page text (truncated):
${opts.pageText || '(empty — fall back to existing fields + training knowledge)'}

Return ONLY valid JSON of this shape; use null for fields you cannot ground:
{"jurisdiction":"...","case_citation":"...","year":2024,"court":"...","strategic_issue":"What was at stake (1–2 sentences)","key_holding":"What the court actually decided (2–3 sentences)","facts":"What happened to the people in this case — one paragraph","reasoning":"Why the court decided this way — the ratio decidendi (2-4 sentences)","dissents":"Dissenting opinions: who and on what point, or null","statutes_cited":["Refugee Convention art. 33","Migration Act 1958 s.36"],"cases_cited":["Plaintiff M70/2011 v Minister","Chen Shi Hai v Minister"],"judges":["Kiefel CJ","Gageler J"],"region":"Europe|Americas|Asia-Pacific|Africa|global|National|<state>","country_code":"ISO 2-letter","categories":["refugee","asylum",...],"outcome":"favorable|adverse|pending","precedent_strength":"high|medium|low"}

Rules:
- Holding ≠ issue. Holding is what the court decided.
- Don't invent. If a field can't be grounded, return null (or [] for the arrays).
- Categories: lowercase, hyphen-separated. Reuse common ones (refugee, asylum, non-refoulement, detention-conditions, youth-justice, etc.) where they fit.
- Statutes/cases/judges: arrays of short strings. Trim honorifics; "Kiefel CJ" not "The Honourable Chief Justice Kiefel".
- Outcome favourable = applicant/petitioner won. Adverse = lost. Pending = ongoing.`;
}

function campaignPrompt(opts: {
  title: string;
  jurisdiction: string | null;
  year: number | null;
  summary: string | null;
  sourceUrl: string;
  pageText: string;
}): string {
  return `You are populating an advocacy-campaign profile in a Justice Matrix. Use the source page below and the existing extracted fields to fill every field you can ground in evidence.

Existing extracted fields:
  title: ${opts.title}
  region/country: ${opts.jurisdiction ?? 'unknown'}
  year: ${opts.year ?? 'unknown'}
  summary: ${opts.summary ?? 'unknown'}
  source_url: ${opts.sourceUrl}

Source page text (truncated):
${opts.pageText || '(empty — fall back to existing fields + training knowledge)'}

Return ONLY valid JSON of this shape; use null for fields you cannot ground:
{"country_region":"...","campaign_name":"...","lead_organizations":"comma-separated leads","goals":"what this seeks (1–2 sentences)","notable_tactics":"how it works (1–2 sentences)","outcome_status":"where it stands (1–2 sentences)","start_year":2018,"country_code":"ISO 2-letter","categories":["refugee","asylum",...],"is_ongoing":true}

Rules:
- Don't invent. Null if you can't ground.
- Categories: lowercase, hyphen-separated.
- is_ongoing=false if the campaign clearly concluded; true otherwise.`;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await checkAdmin();
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;
  const { data: discovery, error } = await supabase
    .from('justice_matrix_discovered')
    .select('id,item_type,source_url,extracted_title,extracted_jurisdiction,extracted_year,extracted_summary')
    .eq('id', id)
    .single();
  if (error || !discovery) {
    return NextResponse.json({ success: false, error: 'Discovery not found' }, { status: 404 });
  }

  const pageText = await fetchSourceText(discovery.source_url);
  const promptOpts = {
    title: discovery.extracted_title || '',
    jurisdiction: discovery.extracted_jurisdiction,
    year: discovery.extracted_year,
    summary: discovery.extracted_summary,
    sourceUrl: discovery.source_url,
    pageText,
  };

  const prompt =
    discovery.item_type === 'campaign' ? campaignPrompt(promptOpts) : casePrompt(promptOpts);

  let text: string;
  try {
    text = await callBackgroundLLM(prompt, { maxTokens: 1500, jsonMode: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: 'All LLM providers exhausted', detail: (e as Error).message?.slice(0, 200) },
      { status: 502 },
    );
  }

  let raw: unknown;
  try {
    raw = parseJSON(text);
  } catch {
    return NextResponse.json({ success: false, error: 'LLM returned malformed JSON' }, { status: 502 });
  }

  const validated =
    discovery.item_type === 'campaign'
      ? validateLLMOutput(raw, CampaignEnrichmentSchema)
      : validateLLMOutput(raw, CaseEnrichmentSchema);

  if (!validated.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed', issues: validated.errors.slice(0, 5) },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    item_type: discovery.item_type,
    enriched: validated.data,
    page_text_chars: pageText.length,
  });
}
