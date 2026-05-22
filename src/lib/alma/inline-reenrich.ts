/**
 * Lean inline re-enrichment for a single org. Used after URL repair so
 * admin gets immediate feedback rather than waiting for the next cron.
 *
 * Intentionally simpler than scripts/alma-org-enrichment.mjs — single LLM
 * call (Cerebras → Gemini fallback), no sitemap mining, no concurrency.
 * Trade-off: ~30% lower extraction quality than the batch script, but
 * sub-15s latency for the "did fixing the URL help?" answer.
 */

import type { LooseSupabaseClient } from '@/lib/supabase/service-lite';

const UA_BROWSER =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const EXTRACTION_PROMPT = `You are extracting structured information from an Australian community organisation's website.

CRITICAL FIRST STEP — identity check:
- represents_named_org: true ONLY if the page is unambiguously the home or primary web presence of the named organisation. false if any doubt.
- represented_entity_name: the name of whichever org the website actually represents.
- reason: one short sentence.

Then extract (null if represents_named_org is false):
- contact_email, contact_phone, contact_name
- annual_report_url, logo_url, history_summary
- confidence: 0.0-1.0
- notes

Return ONLY JSON.`;

interface ProviderConfig {
  name: string;
  key: string | undefined;
  url: string;
  model: string;
}

function providers(): ProviderConfig[] {
  return [
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
  ].filter((p): p is ProviderConfig => !!p.key);
}

async function fetchPage(url: string, ms = 8000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(ms),
      headers: {
        'User-Agent': UA_BROWSER,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-AU,en;q=0.8',
      },
    });
    if (!res.ok) return null;
    return (await res.text()).slice(0, 60000);
  } catch {
    return null;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function callLLM(systemPrompt: string, userContent: string) {
  for (const provider of providers()) {
    try {
      const res = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.key}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: systemPrompt },
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
      // try next
    }
  }
  return null;
}

export interface ReEnrichResult {
  ok: boolean;
  candidate_id?: string;
  status?: string;
  confidence?: number;
  represents_named_org?: boolean;
  reason?: string;
  error?: string;
}

export async function inlineReEnrich(
  supabase: LooseSupabaseClient,
  opts: { orgId: string }
): Promise<ReEnrichResult> {
  if (providers().length === 0) {
    return { ok: false, error: 'no LLM provider env keys configured' };
  }

  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('id, name, slug, suburb, city, state, website_url, website')
    .eq('id', opts.orgId)
    .single();
  if (orgErr || !org) return { ok: false, error: orgErr?.message || 'org not found' };

  const websiteRaw = (org as any).website_url || (org as any).website;
  if (!websiteRaw) return { ok: false, error: 'org has no website URL' };

  let homepage: string;
  try {
    homepage = new URL(/^https?:\/\//i.test(websiteRaw) ? websiteRaw : `https://${websiteRaw}`).href;
  } catch {
    return { ok: false, error: 'website URL is not parseable' };
  }

  const html = await fetchPage(homepage);
  if (!html) return { ok: false, error: 'homepage fetch failed' };

  const body = stripHtml(html).slice(0, 8000);
  const userContent = `Organisation: ${(org as any).name}
Website: ${homepage}
Location: ${[(org as any).suburb, (org as any).city, (org as any).state].filter(Boolean).join(', ') || 'unknown'}

Website content:
${body}`;

  const result = await callLLM(EXTRACTION_PROMPT, userContent);
  if (!result) return { ok: false, error: 'all LLM providers failed' };

  const ext = result.json || {};
  const im = ext.identity_match || {};
  const representsNamedOrg = im.represents_named_org !== false;
  const conf = typeof ext.confidence === 'number' ? ext.confidence : 0;
  const status = representsNamedOrg ? 'pending_review' : 'pending_data_repair';

  const row = {
    organization_id: (org as any).id,
    source: 'website_scrape',
    source_query: { url: homepage, org_slug: (org as any).slug, trigger: 'inline_reenrich' },
    platform: 'web',
    raw_data: { homepage_excerpt: body.slice(0, 4000) },
    extracted_fields: ext,
    confidence: representsNamedOrg ? conf : 0,
    status,
    provenance: {
      llm_provider: result.provider,
      llm_model: result.model,
      fetched_at: new Date().toISOString(),
      script: 'inline-reenrich',
      represents_named_org: representsNamedOrg,
      represented_entity_name: im.represented_entity_name || null,
      identity_check_reason: im.reason || null,
    },
  };

  const { data: inserted, error: insErr } = await supabase
    .from('alma_org_enrichment_candidates')
    .insert(row)
    .select('id')
    .single();
  if (insErr) return { ok: false, error: `insert failed: ${insErr.message}` };

  return {
    ok: true,
    candidate_id: (inserted as any)?.id,
    status,
    confidence: conf,
    represents_named_org: representsNamedOrg,
    reason: im.reason || undefined,
  };
}
