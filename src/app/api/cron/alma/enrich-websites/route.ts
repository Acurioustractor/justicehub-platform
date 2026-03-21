import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { LLMClient } from '@/lib/ai/model-router';
import { parseJSON } from '@/lib/ai/parse-json';
import { OrgWebsiteEnrichmentSchema } from '@/lib/ai/llm-schemas';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

// ── Website Scraping ──────────────────────────────────────────

const SKIP_DOMAINS = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'tiktok.com', 'youtube.com'];

function normalizeUrl(raw: string): string | null {
  let url = raw.trim();
  if (!url.includes('.')) return null;
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
  url = url.replace(/^http:\/\//, 'https://');
  try {
    const parsed = new URL(url);
    if (SKIP_DOMAINS.some((d) => parsed.hostname.includes(d))) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

let consecutiveJinaFailures = 0;

async function scrapeWebsite(rawUrl: string): Promise<string | null> {
  const url = normalizeUrl(rawUrl);
  if (!url) return null;

  // Jina Reader first (free)
  if (consecutiveJinaFailures < 3) {
    try {
      const res = await fetch(`https://r.jina.ai/${url}`, {
        headers: { 'User-Agent': 'JusticeHub/1.0', Accept: 'text/plain' },
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) {
        const text = await res.text();
        if (text.length > 100) {
          consecutiveJinaFailures = 0;
          return text.slice(0, 15_000);
        }
      }
      consecutiveJinaFailures++;
    } catch {
      consecutiveJinaFailures++;
    }
  }

  // Firecrawl fallback
  const fcKey = process.env.FIRECRAWL_API_KEY;
  if (fcKey) {
    try {
      const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fcKey}` },
        body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) {
        const json = await res.json();
        const md = json.data?.markdown || '';
        if (md.length > 100) return md.slice(0, 15_000);
      }
    } catch { /* fallthrough */ }
  }

  // Direct HTML fetch fallback
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'JusticeHub/1.0' },
      signal: AbortSignal.timeout(15_000),
      redirect: 'follow',
    });
    if (res.ok) {
      const html = await res.text();
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text.length > 200) return text.slice(0, 15_000);
    }
  } catch { /* fallthrough */ }

  return null;
}

// ── LLM Extraction Prompt ─────────────────────────────────────

const SYSTEM_PROMPT = `You are a data extraction agent for an Australian youth justice research platform.
Extract structured information from organization websites. Return valid JSON only.
Be conservative — only extract what is clearly stated. Use null for uncertain fields.`;

function buildPrompt(orgName: string, content: string): string {
  return `Extract structured data from this organization's website content.

Organization: ${orgName}

Website content:
${content}

Return a JSON object with these fields:
{
  "description": "2-3 sentence description of the organization (null if unclear)",
  "services_offered": ["list of services/activities"],
  "phone": "phone number or null",
  "email": "contact email or null",
  "sector": "primary sector (e.g. Youth Justice, Legal Services, Community Services, Health, Education, Indigenous Services)",
  "sub_sector": "more specific sub-sector or null",
  "programs": [
    {
      "name": "program name",
      "type": "one of: Diversion, Therapeutic, Community-Led, Education/Employment, Cultural Connection, Early Intervention, Family Strengthening, Justice Reinvestment, Prevention, Wraparound Support",
      "description": "brief description",
      "target_cohort": "who it serves",
      "geography": "where it operates",
      "serves_youth_justice": true/false
    }
  ],
  "is_indigenous_led": false,
  "is_community_controlled": false,
  "target_populations": ["list of target groups"]
}`;
}

// ── Type Mapping ──────────────────────────────────────────────

const VALID_TYPES = new Set([
  'Community-Led', 'Cultural Connection', 'Diversion', 'Early Intervention',
  'Education/Employment', 'Family Strengthening', 'Justice Reinvestment',
  'Prevention', 'Therapeutic', 'Wraparound Support',
]);

const TYPE_MAP: Record<string, string> = {
  'Cultural': 'Cultural Connection', 'Case Management': 'Wraparound Support',
  'Family Support': 'Family Strengthening', 'Advocacy': 'Community-Led',
  'Residential': 'Therapeutic', 'Other': 'Community-Led',
};

function mapInterventionType(raw: string): string {
  if (VALID_TYPES.has(raw)) return raw;
  return TYPE_MAP[raw] || 'Community-Led';
}

// ── Enrichment Logic ──────────────────────────────────────────

interface OrgRow {
  id: string;
  name: string | null;
  website: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  type: string | null;
  is_indigenous_org: boolean | null;
  state: string | null;
  acnc_data: Record<string, unknown> | null;
  gs_entity_id: string | null;
}

interface EnrichStats {
  processed: number;
  orgs_enriched: number;
  gs_entities_enriched: number;
  interventions_discovered: number;
  errors: number;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const batch = Math.min(Math.max(parseInt(url.searchParams.get('batch') || '50'), 1), 100);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- stale generated types missing gs_entities, is_indigenous_org etc.
  const supabase: any = createServiceClient();
  const llm = LLMClient.getBackgroundInstance();
  const now = new Date().toISOString();

  const stats: EnrichStats = {
    processed: 0,
    orgs_enriched: 0,
    gs_entities_enriched: 0,
    interventions_discovered: 0,
    errors: 0,
  };

  try {
    // Fetch orgs needing enrichment (prioritize GS-linked)
    // Note: is_indigenous_org exists in DB but not in stale generated types — cast via `as any`
    const { data: orgs, error: queryErr } = await supabase
      .from('organizations')
      .select('id, name, website, description, phone, email, type, is_indigenous_org, state, acnc_data, gs_entity_id')
      .not('website', 'is', null)
      .or('description.is.null,acnc_data->website_enriched_at.is.null')
      .order('gs_entity_id', { ascending: false, nullsFirst: false })
      .limit(batch);

    if (queryErr) throw queryErr;
    const typedOrgs = orgs as OrgRow[] | null;
    if (!typedOrgs?.length) {
      return NextResponse.json({ ...stats, message: 'No orgs needing enrichment' });
    }

    for (const org of typedOrgs) {
      stats.processed++;

      try {
        // 1. Scrape
        const content = await scrapeWebsite(org.website!);
        if (!content) continue;

        // 2. LLM Extract
        const raw = await llm.call(buildPrompt(org.name || 'Unknown', content), {
          systemPrompt: SYSTEM_PROMPT,
          jsonMode: true,
          temperature: 0.2,
        });
        const parsed = parseJSON(raw);
        const validation = OrgWebsiteEnrichmentSchema.safeParse(parsed);
        if (!validation.success) {
          console.warn(`[enrich-websites] Validation failed for ${org.name}:`, validation.error.issues.slice(0, 3));
          stats.errors++;
          continue;
        }
        const extracted = validation.data;

        // 3. Write organizations (gap-fill only)
        const orgUpdates: Record<string, unknown> = {};
        if (!org.description && extracted.description) orgUpdates.description = extracted.description;
        if (!org.phone && extracted.phone) orgUpdates.phone = extracted.phone;
        if (!org.email && extracted.email) orgUpdates.email = extracted.email;
        if (!org.type && extracted.sector) orgUpdates.type = extracted.sector;
        if (extracted.is_indigenous_led && !org.is_indigenous_org) orgUpdates.is_indigenous_org = true;

        // JSONB merge acnc_data
        const existingAcnc = (org.acnc_data as Record<string, unknown>) || {};
        orgUpdates.acnc_data = {
          ...existingAcnc,
          ...(extracted.services_offered.length ? { services_offered: extracted.services_offered } : {}),
          ...(extracted.description ? { mission_statement: extracted.description } : {}),
          ...(extracted.target_populations.length ? { target_populations: extracted.target_populations } : {}),
          enrichment_source: 'firecrawl_v2',
          website_enriched_at: now,
        };

        const { error: orgErr } = await supabase.from('organizations').update(orgUpdates).eq('id', org.id);
        if (!orgErr) stats.orgs_enriched++;

        // 4. Write gs_entities (if linked)
        if (org.gs_entity_id) {
          const gsResult = await supabase
            .from('gs_entities')
            .select('id, sector, sub_sector, description, source_datasets, metadata')
            .eq('id', org.gs_entity_id)
            .single();
          const entity = gsResult.data as Record<string, unknown> | null;

          if (entity) {
            const gsUpdates: Record<string, unknown> = {};
            if (!entity.sector && extracted.sector) gsUpdates.sector = extracted.sector;
            if (!entity.sub_sector && extracted.sub_sector) gsUpdates.sub_sector = extracted.sub_sector;
            if (!entity.description && extracted.description) gsUpdates.description = extracted.description;

            const datasets = (entity.source_datasets as string[]) || [];
            if (!datasets.includes('firecrawl_website_v2')) {
              gsUpdates.source_datasets = [...datasets, 'firecrawl_website_v2'];
            }

            const existingMeta = (entity.metadata as Record<string, unknown>) || {};
            gsUpdates.metadata = {
              ...existingMeta,
              is_community_controlled: extracted.is_community_controlled || existingMeta.is_community_controlled || false,
              ...(extracted.target_populations.length ? { target_populations: extracted.target_populations } : {}),
              website_enriched_at: now,
            };

            const { error: gsErr } = await supabase.from('gs_entities').update(gsUpdates).eq('id', entity.id);
            if (!gsErr) stats.gs_entities_enriched++;
          }
        }

        // 5. Discover interventions (select-then-insert due to partial unique index)
        for (const program of extracted.programs) {
          if (!program.name || program.name.length < 3) continue;

          const { data: existing } = await supabase
            .from('alma_interventions')
            .select('id')
            .ilike('name', program.name)
            .ilike('operating_organization', org.name || '')
            .limit(1);

          if (existing?.length) continue;

          const { error: intErr } = await supabase.from('alma_interventions').insert({
            name: program.name,
            type: mapInterventionType(program.type || 'Community-Led'),
            description: program.description || null,
            operating_organization: org.name,
            operating_organization_id: org.id,
            verification_status: 'unverified',
            evidence_level: 'Untested (theory/pilot stage)',
            consent_level: 'Strictly Private',
            cultural_authority: 'Not applicable - public program',
            target_cohort: program.target_cohort ? [program.target_cohort] : null,
            geography: program.geography ? [program.geography] : org.state ? [org.state] : null,
            serves_youth_justice: program.serves_youth_justice || false,
          });

          if (!intErr) stats.interventions_discovered++;
        }
      } catch (err) {
        stats.errors++;
        console.error(`[enrich-websites] ${org.name}:`, err instanceof Error ? err.message : err);
      }
    }

    return NextResponse.json(stats);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[enrich-websites] Fatal:', message);
    return NextResponse.json({ error: message, ...stats }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
