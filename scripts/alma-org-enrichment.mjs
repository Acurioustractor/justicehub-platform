#!/usr/bin/env node
/**
 * ALMA Organisation Enrichment — fills out profile completeness for orgs.
 *
 * Picks orgs that have a website but are missing rich profile data
 * (contact email, named contact, history, annual report link), fetches
 * the website, runs an LLM extraction, writes candidates to
 * `alma_org_enrichment_candidates` for human review.
 *
 * Usage:
 *   node scripts/alma-org-enrichment.mjs                     # dry-run, 10 orgs
 *   node scripts/alma-org-enrichment.mjs --apply             # write candidates to DB
 *   node scripts/alma-org-enrichment.mjs --apply --batch 25  # 25 orgs per run
 *
 * Safety:
 *   - Indigenous-led orgs are SKIPPED. They route through the
 *     basecamp-referral pathway, not auto-enrichment.
 *   - Writes only land in `alma_org_enrichment_candidates` with status='pending_review'.
 *     Nothing touches `organizations` directly until a human approves.
 *   - Per-host fetch rate-limited to one request every 1500ms.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter((l) => l && l[0] !== '#' && l.includes('='))
      .forEach((l) => {
        const eq = l.indexOf('=');
        const key = l.slice(0, eq).trim();
        const val = l.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const batchSize = parseInt(args.find((_, i) => args[i - 1] === '--batch') || '10', 10);

const PROVIDERS = [
  {
    name: 'groq',
    key: env.GROQ_API_KEY,
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
  },
  {
    name: 'gemini',
    key: env.GEMINI_API_KEY,
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.5-flash',
  },
  {
    name: 'openai',
    key: env.OPENAI_API_KEY,
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
  },
].filter((p) => p.key);

if (PROVIDERS.length === 0) {
  console.error('No LLM provider keys found in env. Set GROQ_API_KEY / GEMINI_API_KEY / OPENAI_API_KEY.');
  process.exit(1);
}

const EXTRACTION_PROMPT = `You are extracting structured information from an Australian community organisation's website. The org runs youth justice or community-led work.

From the HTML/text below, extract:
- contact_email: the best public-facing contact email (NOT staff personal emails). null if not present.
- contact_phone: the org's main phone number in any format. null if not present.
- contact_name: the most senior named public contact (CEO, Director, Program Lead). null if not present.
- annual_report_url: a direct link to the most recent annual report PDF or page. null if not present.
- logo_url: an img src URL that looks like the org's logo (small, distinctive, in the header or footer). null if not present.
- history_summary: a 2-3 sentence factual summary of when and why the org was founded, drawing only from text on the page. null if not present.
- confidence: 0.0-1.0 — how confident are you that the extracted fields are accurate.
- notes: any caveats (e.g., "site is mostly a landing page", "phone is for a different program").

Return ONLY a JSON object. No prose.`;

const EXTRACTION_SCHEMA = {
  contact_email: 'string | null',
  contact_phone: 'string | null',
  contact_name: 'string | null',
  annual_report_url: 'string | null',
  logo_url: 'string | null',
  history_summary: 'string | null',
  confidence: 'number (0-1)',
  notes: 'string | null',
};

async function callLLM(systemPrompt, userContent) {
  for (const provider of PROVIDERS) {
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
          response_format: { type: 'json_object' },
          temperature: 0,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        console.warn(`  · ${provider.name} returned ${res.status}: ${txt.slice(0, 100)}`);
        continue;
      }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) continue;
      try {
        return { provider: provider.name, model: provider.model, json: JSON.parse(text) };
      } catch (e) {
        const match = text.match(/\{[\s\S]+\}/);
        if (match) {
          return { provider: provider.name, model: provider.model, json: JSON.parse(match[0]) };
        }
      }
    } catch (e) {
      console.warn(`  · ${provider.name} failed: ${e.message}`);
    }
  }
  return null;
}

function normaliseUrl(u) {
  if (!u) return null;
  let s = u.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try {
    const url = new URL(s);
    return url.href;
  } catch {
    return null;
  }
}

async function fetchPage(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'JusticeHubMapBot/1.0 (+https://justicehub.com.au; verification-and-consent outreach)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, 60000);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function processOrg(org) {
  console.log(`\n→ ${org.name} (${org.slug})`);
  const websiteRaw = org.website_url || org.website;
  const homepage = normaliseUrl(websiteRaw);
  if (!homepage) {
    console.log('  · no usable website URL; skipping');
    return null;
  }

  const homepageHtml = await fetchPage(homepage);
  if (!homepageHtml) {
    console.log('  · homepage fetch failed; skipping');
    return null;
  }

  // Best-effort fetch of /contact and /about — concatenate into one body
  const u = new URL(homepage);
  const candidatePaths = ['/contact', '/contact-us', '/about', '/about-us'];
  let supplementary = '';
  for (const path of candidatePaths) {
    try {
      const next = new URL(path, u).href;
      await new Promise((r) => setTimeout(r, 1500));
      const html = await fetchPage(next);
      if (html) supplementary += `\n\n[FROM ${next}]\n` + stripHtml(html).slice(0, 4000);
    } catch {
      // ignore
    }
  }

  const body = stripHtml(homepageHtml).slice(0, 6000) + supplementary;
  const userContent = `Organisation: ${org.name}\nWebsite: ${homepage}\nLocation: ${[org.suburb, org.city, org.state].filter(Boolean).join(', ') || 'unknown'}\n\nExpected output shape:\n${JSON.stringify(EXTRACTION_SCHEMA, null, 2)}\n\nWebsite content:\n${body}`;

  const result = await callLLM(EXTRACTION_PROMPT, userContent);
  if (!result) {
    console.log('  · all LLM providers failed');
    return null;
  }

  const ext = result.json;
  const fields = [
    ext.contact_email ? 'email' : null,
    ext.contact_phone ? 'phone' : null,
    ext.contact_name ? 'name' : null,
    ext.annual_report_url ? 'annual-report' : null,
    ext.logo_url ? 'logo' : null,
    ext.history_summary ? 'history' : null,
  ].filter(Boolean);

  const conf = typeof ext.confidence === 'number' ? ext.confidence : 0;

  // Drop zero-confidence / empty extractions — they bloat the review queue
  // without adding anything. Next pass with a different source will retry.
  if (conf === 0 || fields.length === 0) {
    console.log(`  · ${result.provider}: confidence=0 / no fields — dropping (not enqueued)`);
    return null;
  }

  // Detect website mismatch (LLM flags when the page is for a different org).
  // Route these to a data-repair lane instead of the outreach review queue.
  const notes = String(ext.notes || '').toLowerCase();
  const isMismatch =
    notes.includes('not match') ||
    notes.includes('different org') ||
    notes.includes('wrong website') ||
    notes.includes('does not match');
  const status = isMismatch ? 'pending_data_repair' : 'pending_review';

  console.log(
    `  · ${result.provider}: confidence=${conf} · ${fields.join(', ') || 'no fields found'}${
      isMismatch ? ' · MISMATCH → data-repair lane' : ''
    }`
  );

  return {
    organization_id: org.id,
    source: 'website_scrape',
    source_query: { url: homepage, org_slug: org.slug },
    platform: 'web',
    raw_data: { homepage_excerpt: body.slice(0, 4000) },
    extracted_fields: ext,
    confidence: conf,
    status,
    provenance: {
      llm_provider: result.provider,
      llm_model: result.model,
      fetched_at: new Date().toISOString(),
      script: 'alma-org-enrichment.mjs',
      mismatch_detected: isMismatch,
    },
  };
}

async function main() {
  console.log(
    `ALMA org enrichment · ${apply ? 'APPLY' : 'DRY-RUN'} · batch=${batchSize}\n`
  );

  // Pick orgs:
  // - linked to a public intervention
  // - has a website
  // - not Indigenous-led (those route through basecamp referral)
  // - not already a featured exemplar
  // - no recent candidate (avoid re-processing)
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select(
      'id, name, slug, website_url, website, suburb, city, state, is_indigenous_org, profile_completeness_score, featured_on_map'
    )
    .neq('archived', true)
    .eq('is_indigenous_org', false)
    .neq('featured_on_map', true)
    .or('website_url.not.is.null,website.not.is.null')
    .order('profile_completeness_score', { ascending: false, nullsFirst: false })
    .limit(batchSize * 3);

  if (error) {
    console.error('Failed to fetch orgs:', error.message);
    process.exit(1);
  }

  const candidates = (orgs || []).filter((o) => (o.website_url || o.website || '').length > 0);

  // Skip orgs that already have a recent pending candidate
  const ids = candidates.map((c) => c.id);
  const { data: existing } = await supabase
    .from('alma_org_enrichment_candidates')
    .select('organization_id')
    .in('organization_id', ids)
    .eq('source', 'website_scrape')
    .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());

  const recentSet = new Set((existing || []).map((e) => e.organization_id));
  const afterDedup = candidates.filter((c) => !recentSet.has(c.id));
  const dedupedOut = candidates.length - afterDedup.length;
  const todo = afterDedup.slice(0, batchSize);
  const trimmed = afterDedup.length - todo.length;

  console.log(
    `Found ${candidates.length} eligible orgs · ${dedupedOut} already have a candidate from the last 14 days · ${trimmed} held back by batch size · processing ${todo.length}.`
  );

  const results = [];
  for (const org of todo) {
    const c = await processOrg(org);
    if (c) results.push(c);
    // be polite to the network
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`\n${results.length} candidates produced.`);

  if (!apply) {
    console.log('Dry-run: not writing to DB. Pass --apply to insert into alma_org_enrichment_candidates.');
    console.log('\nSample candidate:\n', JSON.stringify(results[0], null, 2));
    return;
  }

  if (results.length === 0) {
    console.log('Nothing to write.');
    return;
  }

  const { error: insertErr, data: inserted } = await supabase
    .from('alma_org_enrichment_candidates')
    .insert(results)
    .select('id, organization_id');
  if (insertErr) {
    console.error('Insert failed:', insertErr.message);
    process.exit(1);
  }

  console.log(`Inserted ${inserted?.length || 0} candidates into alma_org_enrichment_candidates.`);
  console.log('Review them at /admin/alma/outreach-queue.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
