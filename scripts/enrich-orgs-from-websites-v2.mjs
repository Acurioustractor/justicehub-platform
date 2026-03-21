#!/usr/bin/env node
/**
 * Unified Org Website Enrichment Pipeline v2
 *
 * Scrapes org websites → LLM extraction → enriches organizations + gs_entities + discovers ALMA interventions.
 *
 * Data flow per org:
 *   1. Scrape website via Jina Reader (free) → Firecrawl fallback
 *   2. LLM extract structured data (description, services, programs, etc.)
 *   3. Write organizations table (description, phone, email, type, acnc_data JSONB merge)
 *   4. Write gs_entities (if linked) — sector, sub_sector, description, metadata
 *   5. Discover interventions from extracted programs → alma_interventions
 *
 * Usage:
 *   node scripts/enrich-orgs-from-websites-v2.mjs              # dry-run, 50 orgs
 *   node scripts/enrich-orgs-from-websites-v2.mjs --limit 10   # dry-run, 10 orgs
 *   node scripts/enrich-orgs-from-websites-v2.mjs --apply      # write to DB, 50 orgs
 *   node scripts/enrich-orgs-from-websites-v2.mjs --apply --limit 200
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── Load env ──────────────────────────────────────────────────
function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .forEach((l) => {
        const eqIdx = l.indexOf('=');
        const key = l.slice(0, eqIdx).trim();
        const val = l.slice(eqIdx + 1).trim();
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const applyMode = process.argv.includes('--apply');
const limitArg = process.argv.find((a, i) => process.argv[i - 1] === '--limit');
const BATCH_SIZE = parseInt(limitArg || '50', 10);

const DELAY = (ms) => new Promise((r) => setTimeout(r, ms));
const USER_AGENT = 'JusticeHub/1.0 (benjamin@act.place; youth justice research platform)';
const TODAY = new Date().toISOString();

// ── LLM Providers (background priority: MiniMax → Groq → DeepSeek → Gemini) ──
const PROVIDERS = [
  { name: 'minimax', key: 'MINIMAX_API_KEY', url: 'https://api.minimaxi.chat/v1', model: 'MiniMax-M2.5', jsonMode: false, reasoning: true },
  { name: 'groq', key: 'GROQ_API_KEY', url: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', jsonMode: true, reasoning: false },
  { name: 'deepseek', key: 'DEEPSEEK_API_KEY', url: 'https://api.deepseek.com/v1', model: 'deepseek-chat', jsonMode: true, reasoning: true },
  { name: 'gemini', key: 'GEMINI_API_KEY', url: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash', jsonMode: true, reasoning: false },
];

let providerIdx = 0;
const disabledProviders = new Set();

function stripThink(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

async function callLLM(prompt, systemPrompt) {
  const active = PROVIDERS.filter((p) => env[p.key] && !disabledProviders.has(p.name));
  if (!active.length) throw new Error('No LLM providers configured');

  for (let i = 0; i < active.length; i++) {
    const p = active[providerIdx % active.length];
    providerIdx++;
    try {
      const body = {
        model: p.model,
        max_tokens: 4096,
        temperature: 0.2,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
      };
      if (p.jsonMode) body.response_format = { type: 'json_object' };

      const res = await fetch(`${p.url}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env[p.key]}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
      });

      if (!res.ok) {
        const status = res.status;
        if (status === 429) { console.warn(`  [LLM] ${p.name} rate limited`); continue; }
        if (status === 402 || status === 403) { disabledProviders.add(p.name); continue; }
        throw new Error(`${p.name} ${status}`);
      }

      const json = await res.json();
      let text = json.choices?.[0]?.message?.content || '';
      if (p.reasoning) text = stripThink(text);
      return text;
    } catch (err) {
      console.warn(`  [LLM] ${p.name}: ${err.message}`);
    }
  }
  throw new Error('All LLM providers failed');
}

function parseJSON(text) {
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/`{3,}[\w]*\s*\n?/gi, '').replace(/`{3,}\s*$/gm, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/(\{[\s\S]*\})/);
  if (match) {
    let prepped = match[1].replace(/,\s*([}\]])/g, '$1');
    try { return JSON.parse(prepped); } catch {}
  }
  throw new Error('Failed to parse JSON from LLM response');
}

// ── Website Scraping ──────────────────────────────────────────

/** Domains that block scrapers or return useless content */
const SKIP_DOMAINS = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'tiktok.com', 'youtube.com'];

/** Normalize URL: ensure https://, strip trailing slash, fix missing TLDs */
function normalizeUrl(raw) {
  let url = raw.trim();
  // Skip obviously broken URLs (no dot = no TLD)
  if (!url.includes('.')) return null;
  // Ensure protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  // Upgrade http to https
  url = url.replace(/^http:\/\//, 'https://');
  try {
    const parsed = new URL(url);
    // Skip social media domains
    if (SKIP_DOMAINS.some((d) => parsed.hostname.includes(d))) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

let consecutiveJinaFailures = 0;

async function scrapeWebsite(rawUrl) {
  const url = normalizeUrl(rawUrl);
  if (!url) return null;

  // Try Jina Reader first (free)
  if (consecutiveJinaFailures < 3) {
    try {
      const jinaUrl = `https://r.jina.ai/${url}`;
      const res = await fetch(jinaUrl, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/plain' },
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) {
        const text = await res.text();
        if (text.length > 100) {
          consecutiveJinaFailures = 0;
          return text.slice(0, 15_000); // Cap at 15k chars for LLM context
        }
      }
      consecutiveJinaFailures++;
    } catch {
      consecutiveJinaFailures++;
    }
  }

  // Firecrawl fallback
  if (env.FIRECRAWL_API_KEY) {
    try {
      const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) {
        const json = await res.json();
        const md = json.data?.markdown || '';
        if (md.length > 100) return md.slice(0, 15_000);
      }
    } catch {}
  }

  // Direct HTML fetch fallback (strips tags, basic text extraction)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(15_000),
      redirect: 'follow',
    });
    if (res.ok) {
      const html = await res.text();
      // Strip HTML tags, scripts, styles → plain text
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text.length > 200) return text.slice(0, 15_000);
    }
  } catch {}

  return null;
}

// ── LLM Extraction ───────────────────────────────────────────

const EXTRACTION_SYSTEM = `You are a data extraction agent for an Australian youth justice research platform.
Extract structured information from organization websites. Return valid JSON only.
Be conservative — only extract what is clearly stated. Use null for uncertain fields.`;

function buildExtractionPrompt(orgName, websiteContent) {
  return `Extract structured data from this organization's website content.

Organization: ${orgName}

Website content:
${websiteContent}

Return a JSON object with these fields:
{
  "description": "2-3 sentence description of the organization (null if unclear)",
  "services_offered": ["list of services/activities"],
  "phone": "phone number or null",
  "email": "contact email or null",
  "sector": "primary sector (e.g. Youth Justice, Legal Services, Community Services, Health, Education, Indigenous Services, Disability, Housing, Family Services, Mental Health)",
  "sub_sector": "more specific sub-sector or null",
  "programs": [
    {
      "name": "program name",
      "type": "one of: Diversion, Therapeutic, Community-Led, Education/Employment, Cultural Connection, Early Intervention, Family Strengthening, Justice Reinvestment, Prevention, Wraparound Support",
      "description": "brief description",
      "target_cohort": "who it serves (e.g. young people 10-17, Aboriginal families)",
      "geography": "where it operates (state/region/suburb)",
      "serves_youth_justice": true/false
    }
  ],
  "is_indigenous_led": false,
  "is_community_controlled": false,
  "target_populations": ["list of target groups"]
}`;
}

// ── Database Writes ──────────────────────────────────────────

async function writeOrganization(org, extracted) {
  const updates = {};

  // Only fill gaps — never overwrite non-null
  if (!org.description && extracted.description) updates.description = extracted.description;
  if (!org.phone && extracted.phone) updates.phone = extracted.phone;
  if (!org.email && extracted.email) updates.email = extracted.email;
  if (!org.type && extracted.sector) updates.type = extracted.sector;
  if (extracted.is_indigenous_led && !org.is_indigenous_org) updates.is_indigenous_org = true;

  // JSONB merge into acnc_data
  const existingAcnc = org.acnc_data || {};
  updates.acnc_data = {
    ...existingAcnc,
    ...(extracted.services_offered?.length ? { services_offered: extracted.services_offered } : {}),
    ...(extracted.description ? { mission_statement: extracted.description } : {}),
    ...(extracted.target_populations?.length ? { target_populations: extracted.target_populations } : {}),
    enrichment_source: 'firecrawl_v2',
    website_enriched_at: TODAY,
  };

  if (Object.keys(updates).length <= 1 && !extracted.services_offered?.length) {
    return false; // Only timestamp, no real data
  }

  const { error } = await supabase.from('organizations').update(updates).eq('id', org.id);
  if (error) { console.error(`  [DB] org ${org.id}: ${error.message}`); return false; }
  return true;
}

async function writeGsEntity(org, extracted) {
  if (!org.gs_entity_id) return false;

  // Fetch current gs_entity
  const { data: entity } = await supabase
    .from('gs_entities')
    .select('id, sector, sub_sector, description, source_datasets, metadata')
    .eq('id', org.gs_entity_id)
    .single();

  if (!entity) return false;

  const updates = {};

  if (!entity.sector && extracted.sector) updates.sector = extracted.sector;
  if (!entity.sub_sector && extracted.sub_sector) updates.sub_sector = extracted.sub_sector;
  if (!entity.description && extracted.description) updates.description = extracted.description;

  // Append source_datasets
  const datasets = entity.source_datasets || [];
  if (!datasets.includes('firecrawl_website_v2')) {
    updates.source_datasets = [...datasets, 'firecrawl_website_v2'];
  }

  // JSONB merge metadata
  const existingMeta = entity.metadata || {};
  updates.metadata = {
    ...existingMeta,
    is_community_controlled: extracted.is_community_controlled || existingMeta.is_community_controlled || false,
    target_populations: extracted.target_populations?.length ? extracted.target_populations : existingMeta.target_populations,
    website_enriched_at: TODAY,
  };

  const { error } = await supabase.from('gs_entities').update(updates).eq('id', entity.id);
  if (error) { console.error(`  [DB] gs_entity ${entity.id}: ${error.message}`); return false; }
  return true;
}

const VALID_TYPES = new Set([
  'Community-Led', 'Cultural Connection', 'Diversion', 'Early Intervention',
  'Education/Employment', 'Family Strengthening', 'Justice Reinvestment',
  'Prevention', 'Therapeutic', 'Wraparound Support',
]);

function mapType(raw) {
  if (VALID_TYPES.has(raw)) return raw;
  // Common LLM mappings
  const map = {
    'Cultural': 'Cultural Connection', 'Case Management': 'Wraparound Support',
    'Family Support': 'Family Strengthening', 'Advocacy': 'Community-Led',
    'Residential': 'Therapeutic', 'Other': 'Community-Led',
  };
  return map[raw] || 'Community-Led';
}

async function discoverInterventions(org, extracted) {
  if (!extracted.programs?.length) return 0;

  let discovered = 0;

  for (const program of extracted.programs) {
    if (!program.name || program.name.length < 3) continue;

    // Check uniqueness: LOWER(name) + LOWER(COALESCE(operating_organization, ''))
    const { data: existing } = await supabase
      .from('alma_interventions')
      .select('id')
      .ilike('name', program.name)
      .ilike('operating_organization', org.name || '')
      .limit(1);

    if (existing?.length) continue;

    const intervention = {
      name: program.name,
      type: mapType(program.type || 'Other'),
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
    };

    const { error } = await supabase.from('alma_interventions').insert(intervention);
    if (!error) discovered++;
    else if (!error.message?.includes('duplicate')) {
      console.error(`  [DB] intervention "${program.name}": ${error.message}`);
    }
  }

  return discovered;
}

// ── Main Pipeline ────────────────────────────────────────────

async function main() {
  console.log(`\n🌐 Org Website Enrichment Pipeline v2`);
  console.log(`   Mode: ${applyMode ? '✅ APPLY (writing to DB)' : '🔍 DRY-RUN (preview only)'}`);
  console.log(`   Batch: ${BATCH_SIZE} orgs\n`);

  // Fetch orgs with websites needing enrichment
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, name, website, description, phone, email, type, is_indigenous_org, state, acnc_data, gs_entity_id')
    .not('website', 'is', null)
    .or('description.is.null,acnc_data->website_enriched_at.is.null')
    .order('gs_entity_id', { ascending: false, nullsFirst: false }) // Prioritize GS-linked orgs
    .limit(BATCH_SIZE);

  if (error) { console.error('Query error:', error.message); process.exit(1); }
  if (!orgs?.length) { console.log('No orgs needing enrichment.'); return; }

  console.log(`Found ${orgs.length} orgs to process\n`);

  const stats = { processed: 0, scraped: 0, extracted: 0, orgs_enriched: 0, gs_enriched: 0, interventions: 0, errors: 0 };

  for (let i = 0; i < orgs.length; i++) {
    const org = orgs[i];
    stats.processed++;

    if ((i + 1) % 100 === 0) {
      console.log(`  Progress: ${i + 1}/${orgs.length} (${stats.orgs_enriched} enriched, ${stats.interventions} interventions discovered)`);
    }

    try {
      // 1. Scrape
      const content = await scrapeWebsite(org.website);
      if (!content) {
        console.log(`  ⏭ ${org.name} — scrape failed (${org.website})`);
        continue;
      }
      stats.scraped++;

      // 2. LLM Extract
      let extracted;
      try {
        const raw = await callLLM(buildExtractionPrompt(org.name, content), EXTRACTION_SYSTEM);
        extracted = parseJSON(raw);
      } catch (err) {
        console.log(`  ⚠ ${org.name} — LLM extraction failed: ${err.message}`);
        stats.errors++;
        continue;
      }
      stats.extracted++;

      if (!applyMode) {
        // Dry-run: just show what would be written
        const fields = [];
        if (!org.description && extracted.description) fields.push('description');
        if (!org.phone && extracted.phone) fields.push('phone');
        if (!org.email && extracted.email) fields.push('email');
        if (extracted.services_offered?.length) fields.push(`${extracted.services_offered.length} services`);
        if (extracted.programs?.length) fields.push(`${extracted.programs.length} programs`);
        console.log(`  ✓ ${org.name}: ${fields.join(', ') || 'no new data'}`);
        if (extracted.programs?.length) stats.interventions += extracted.programs.length;
        if (fields.length) stats.orgs_enriched++;
        if (org.gs_entity_id) stats.gs_enriched++;
        continue;
      }

      // 3. Write organizations
      const orgWritten = await writeOrganization(org, extracted);
      if (orgWritten) stats.orgs_enriched++;

      // 4. Write gs_entities
      const gsWritten = await writeGsEntity(org, extracted);
      if (gsWritten) stats.gs_enriched++;

      // 5. Discover interventions
      const newInterventions = await discoverInterventions(org, extracted);
      stats.interventions += newInterventions;

      const summary = [
        orgWritten ? 'org✓' : 'org—',
        gsWritten ? 'gs✓' : 'gs—',
        newInterventions > 0 ? `${newInterventions} programs` : '',
      ].filter(Boolean).join(' ');
      console.log(`  ✓ ${org.name}: ${summary}`);

      // Rate limiting: 200ms between orgs
      await DELAY(200);
    } catch (err) {
      stats.errors++;
      console.error(`  ✗ ${org.name}: ${err.message}`);
    }
  }

  // Final report
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📊 Enrichment Complete`);
  console.log(`   Processed:     ${stats.processed}`);
  console.log(`   Scraped:       ${stats.scraped}`);
  console.log(`   Extracted:     ${stats.extracted}`);
  console.log(`   Orgs enriched: ${stats.orgs_enriched}`);
  console.log(`   GS entities:   ${stats.gs_enriched}`);
  console.log(`   Interventions: ${stats.interventions}`);
  console.log(`   Errors:        ${stats.errors}`);
  console.log(`${'─'.repeat(60)}\n`);
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
