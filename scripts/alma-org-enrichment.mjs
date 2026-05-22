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
 *   node scripts/alma-org-enrichment.mjs                                  # dry-run, 10 orgs
 *   node scripts/alma-org-enrichment.mjs --apply                          # write candidates to DB
 *   node scripts/alma-org-enrichment.mjs --apply --batch 200              # 200 orgs per run
 *   node scripts/alma-org-enrichment.mjs --apply --batch 200 --concurrency 4
 *   node scripts/alma-org-enrichment.mjs --apply --retry-failed --batch 50  # re-attempt past fetch failures
 *
 * Recommended scaling cadence:
 *   - Daily: `--apply --batch 200 --concurrency 4` (~600 orgs/run, ~10 min wall-clock)
 *   - Weekly: `--retry-failed --apply --batch 100` to recover stuck fetches
 *
 * Safety:
 *   - Indigenous-led orgs are SKIPPED. They route through the
 *     basecamp-referral pathway, not auto-enrichment.
 *   - Writes only land in `alma_org_enrichment_candidates` with status='pending_review'.
 *     Nothing touches `organizations` directly until a human approves.
 *   - Within an org's processing the per-host fetch is throttled (1500ms).
 *     Across orgs, --concurrency workers each handle a different host so
 *     parallel work doesn't hammer one server.
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
// Number of orgs to process in parallel. Each org makes 1-5 fetches to a
// different host plus 1 LLM call, so 4-way concurrency lifts throughput from
// ~1 org/2s to ~2.5 orgs/s without hammering any single host. Higher values
// start tripping LLM rate limits and the polite per-host delay loses meaning.
const concurrency = Math.max(1, Math.min(8, parseInt(args.find((_, i) => args[i - 1] === '--concurrency') || '4', 10)));
// Re-process orgs whose only candidate is a skip marker (homepage_fetch_failed,
// extraction_empty, all_llm_providers_failed). The fetch hardening lets us
// recover ~17% of those without removing them first.
const retryFailed = args.includes('--retry-failed');

// Provider order — calibrated against the first ~1400 candidates produced:
//   cerebras: 0.715 avg confidence, 26% URL-mismatch (best by a wide margin)
//   gemini:   0.502 avg, 34% mismatch
//   groq:     0.555 avg, 33% mismatch (rate-limits fast on volume runs)
//   sambanova:0.528 avg, 26% mismatch
//   minimax:  0.255 avg, 70% mismatch (dropped — too noisy on identity)
//
// We put Cerebras first because it produces the highest-quality extractions
// AND ships them fast. Groq is second (fastest reliable fallback when the
// Cerebras quota burns through). SambaNova is third — same Llama-3.3-70B as
// Groq on a separate quota bucket. Gemini caps the chain as the volume
// safety-valve. DeepSeek and OpenAI are paid backstops.
const PROVIDERS = [
  {
    name: 'cerebras',
    key: env.CEREBRAS_API_KEY,
    url: 'https://api.cerebras.ai/v1/chat/completions',
    model: 'qwen-3-235b-a22b-instruct-2507',
    jsonMode: true,
  },
  {
    name: 'groq',
    key: env.GROQ_API_KEY,
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    jsonMode: true,
  },
  {
    name: 'sambanova',
    key: env.SAMBANOVA_API_KEY,
    url: 'https://api.sambanova.ai/v1/chat/completions',
    model: 'Meta-Llama-3.3-70B-Instruct',
    jsonMode: true,
  },
  {
    name: 'gemini',
    key: env.GEMINI_API_KEY,
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.5-flash',
    jsonMode: true,
  },
  {
    name: 'deepseek',
    key: env.DEEPSEEK_API_KEY,
    url: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    jsonMode: true,
  },
  {
    name: 'openai',
    key: env.OPENAI_API_KEY,
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    jsonMode: true,
  },
].filter((p) => p.key);

if (PROVIDERS.length === 0) {
  console.error('No LLM provider keys found in env. Set at least one of: GROQ / SAMBANOVA / CEREBRAS / GEMINI / MINIMAX / DEEPSEEK / OPENAI _API_KEY.');
  process.exit(1);
}

console.log(`LLM chain (${PROVIDERS.length}): ${PROVIDERS.map((p) => p.name).join(' → ')}`);

const EXTRACTION_PROMPT = `You are extracting structured information from an Australian community organisation's website. The org runs youth justice or community-led work.

CRITICAL FIRST STEP — identity check:
Before extracting any fields, decide whether the website on this page is primarily about the named organisation, or whether the URL on file is wrong (a different org's site, a parent body, an aggregator, a search result, a parked domain, or an unrelated business).

Output an "identity_match" object with:
- represents_named_org: true ONLY if the page is unambiguously the home or primary web presence of the named organisation. false if any doubt.
- represented_entity_name: the name of whichever organisation the website actually represents (could be the same name, a parent, a sponsor, or something completely different).
- reason: one short sentence explaining how you decided.

Then extract the org fields (set them to null if represents_named_org is false — do not extract another org's data and label it as the named one):
- contact_email: best public-facing contact email (NOT staff personal emails). null if not present.
- contact_phone: the org's main phone number in any format. null if not present.
- contact_name: the most senior named public contact (CEO, Director, Program Lead). null if not present.
- annual_report_url: a direct link to the most recent annual report PDF or page. null if not present.
- logo_url: an img src URL that looks like the org's logo. null if not present.
- history_summary: a 2-3 sentence factual summary of when and why the org was founded, drawing only from text on the page. null if not present.
- confidence: 0.0-1.0 — how confident are you that the extracted fields belong to the NAMED organisation. If represents_named_org is false this MUST be 0.
- notes: any caveats.

Return ONLY a JSON object. No prose.`;

const EXTRACTION_SCHEMA = {
  identity_match: {
    represents_named_org: 'boolean',
    represented_entity_name: 'string',
    reason: 'string',
  },
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
      const body = {
        model: provider.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0,
      };
      if (provider.jsonMode) {
        body.response_format = { type: 'json_object' };
      }
      const res = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.key}`,
        },
        body: JSON.stringify(body),
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

// User-agent strategies. Some community-org hosts (Cloudflare, expired
// security certificates on older AU charity hosts) reject the polite-bot UA
// but accept a browser-like one. We try ours first as a courtesy, then
// fall back to a generic browser UA.
const UA_POLITE =
  'JusticeHubMapBot/1.0 (+https://justicehub.com.au; verification-and-consent outreach)';
const UA_BROWSER =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

async function fetchPageOnce(url, ua, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': ua,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-AU,en;q=0.8',
      },
    });
    if (!res.ok) return { ok: false, status: res.status, url };
    const text = await res.text();
    return { ok: true, body: text.slice(0, 60000), url, finalUrl: res.url };
  } catch (e) {
    return { ok: false, error: e?.message || 'fetch error', url };
  } finally {
    clearTimeout(timer);
  }
}

function variantsOf(rawUrl) {
  // Try the URL as-is first. Then toggle www/non-www, then swap protocols.
  // Order matters — every retry costs a network round-trip and AU community
  // hosts can be slow.
  const out = [rawUrl];
  try {
    const u = new URL(rawUrl);
    const host = u.hostname;
    if (host.startsWith('www.')) {
      const noWww = new URL(rawUrl);
      noWww.hostname = host.slice(4);
      out.push(noWww.href);
    } else {
      const withWww = new URL(rawUrl);
      withWww.hostname = 'www.' + host;
      out.push(withWww.href);
    }
    if (u.protocol === 'https:') {
      const httpVer = new URL(rawUrl);
      httpVer.protocol = 'http:';
      out.push(httpVer.href);
    }
  } catch {
    /* ignore */
  }
  return Array.from(new Set(out));
}

// Fetch a page with a layered fallback strategy. Returns { body, strategy }
// where strategy identifies what worked — useful for telemetry on which
// fallback recovers most fetches. Returns null when every variant failed.
async function fetchPage(url, timeoutMs = 8000) {
  const variants = variantsOf(url);
  const attempts = [];
  for (const variant of variants) {
    for (const ua of [UA_POLITE, UA_BROWSER]) {
      const r = await fetchPageOnce(variant, ua, timeoutMs);
      attempts.push({ url: variant, ua: ua === UA_POLITE ? 'polite' : 'browser', ok: r.ok, status: r.status || null, error: r.error || null });
      if (r.ok && r.body) {
        return {
          body: r.body,
          strategy: { tried: attempts.length, succeeded_with: { url: variant, ua: ua === UA_POLITE ? 'polite' : 'browser', final_url: r.finalUrl } },
        };
      }
    }
  }
  return { body: null, strategy: { tried: attempts.length, attempts } };
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

// ---------------------------------------------------------------------------
// Email + phone validation
// ---------------------------------------------------------------------------

// Generic mailboxes that a community org legitimately publishes (and that
// we can publish on the Map without worrying about doxxing an individual).
const GENERIC_MAILBOXES = new Set([
  'info',
  'contact',
  'hello',
  'enquiries',
  'admin',
  'office',
  'mail',
  'general',
  'reception',
  'support',
  'team',
  'membership',
  'media',
]);

// Cache MX lookups inside a single script run — different orgs often share
// a host (Squarespace, Wix, charity hosting providers) and looking up the
// same domain dozens of times is wasted DNS load.
const mxCache = new Map();

async function hasMxRecord(domain) {
  if (mxCache.has(domain)) return mxCache.get(domain);
  try {
    // Lazy-load — `node:dns/promises` is built-in but not always available
    // on older Node runtimes. If the import errors we degrade to "unknown"
    // (treated as not-invalid downstream so we don't throw the email away).
    const dns = await import('node:dns/promises');
    const rec = await dns.resolveMx(domain);
    const ok = Array.isArray(rec) && rec.length > 0;
    mxCache.set(domain, ok);
    return ok;
  } catch {
    mxCache.set(domain, null);
    return null;
  }
}

async function validateEmail(raw) {
  if (!raw || typeof raw !== 'string') {
    return { kind: 'missing', generic: false };
  }
  const trimmed = raw.trim().toLowerCase();
  // Conservative RFC-shape regex — good enough for filtering obvious junk
  // without rejecting valid funky community-org addresses.
  const shape = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  if (!shape.test(trimmed)) {
    return { kind: 'invalid', reason: 'bad_format', generic: false };
  }
  const [local, domain] = trimmed.split('@');
  const generic = GENERIC_MAILBOXES.has(local);
  const mx = await hasMxRecord(domain);
  if (mx === false) {
    return { kind: 'invalid', reason: 'no_mx', generic, domain };
  }
  return {
    kind: 'valid',
    generic,
    domain,
    mx_checked: mx !== null,
  };
}

function validatePhone(raw) {
  if (!raw || typeof raw !== 'string') {
    return { kind: 'missing' };
  }
  const digits = raw.replace(/[^\d]/g, '');
  // AU phones — 10 digits (area + local) or 11 with country code 61.
  // Mobile = starts with 04 (or 614). Landline = 02/03/07/08 area code.
  if (digits.length < 8 || digits.length > 12) {
    return { kind: 'invalid', reason: 'wrong_length', digits };
  }
  // Strip a leading 61 country code so the rest looks like a local AU number.
  let local = digits.startsWith('61') ? digits.slice(2) : digits;
  if (local.length === 9 && !local.startsWith('0')) local = '0' + local;
  if (local.length !== 10) {
    return { kind: 'maybe', reason: 'non_au_format', digits };
  }
  const isMobile = local.startsWith('04');
  const isLandline = /^0[23478]/.test(local);
  return {
    kind: 'valid',
    formatted_local: local,
    formatted_international: '+61' + local.slice(1),
    line_type: isMobile ? 'mobile' : isLandline ? 'landline' : 'unknown',
  };
}

// Fetch the org's sitemap.xml (and sitemap_index.xml fallback) and return
// a ranked list of paths that look most likely to contain contact, team,
// or annual-report content. Returns at most 20 paths, ranked by keyword
// match against the URL path itself.
async function discoverPathsFromSitemap(baseUrl) {
  const KEYWORDS = [
    'contact',
    'about',
    'team',
    'staff',
    'people',
    'leadership',
    'board',
    'annual-report',
    'annual_report',
    'report',
    'history',
    'mission',
    'our-story',
    'publication',
  ];
  const candidates = ['/sitemap.xml', '/sitemap_index.xml'];
  for (const c of candidates) {
    try {
      const xmlUrl = new URL(c, baseUrl).href;
      const res = await fetchPage(xmlUrl, 5000);
      if (!res.body) continue;
      // Two cases — flat <urlset> or <sitemapindex> pointing to nested sitemaps.
      // We don't recurse into nested sitemaps; the homepage one is enough for
      // small community orgs.
      const urls = Array.from(res.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)).map((m) => m[1]);
      if (urls.length === 0) continue;
      const scored = urls
        .map((u) => {
          let s = 0;
          const lower = u.toLowerCase();
          for (const k of KEYWORDS) if (lower.includes(k)) s += 1;
          return { url: u, score: s };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .map((x) => x.url);
      if (scored.length > 0) return scored;
    } catch {
      // ignore — site doesn't have a sitemap
    }
  }
  return [];
}

function extractLogoCandidates(html, baseUrl) {
  const found = [];
  // og:image — usually a real social-card image
  const og =
    html.match(/<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (og) found.push({ src: og[1], source: 'og:image' });

  // apple-touch-icon — often a clean square logo
  const apple = html.match(
    /<link\s+[^>]*rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*href=["']([^"']+)["']/i
  );
  if (apple) found.push({ src: apple[1], source: 'apple-touch-icon' });

  // <img> tags whose src/class/alt/id contains "logo"
  for (const m of html.matchAll(/<img\s+([^>]+?)\/?>/gi)) {
    const tag = m[0];
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (!src) continue;
    const looksLogo = /(?:\bclass|\balt|\bid)=["'][^"']*logo[^"']*["']/i.test(tag) ||
                      /\/[^/]*logo[^/]*\.(?:svg|png|jpg|jpeg|webp)/i.test(src);
    if (looksLogo) found.push({ src, source: 'img-with-logo-attr' });
  }

  // Normalize to absolute URLs, dedupe, cap at 5
  const seen = new Set();
  const out = [];
  for (const c of found) {
    try {
      const abs = new URL(c.src, baseUrl).href;
      if (seen.has(abs)) continue;
      seen.add(abs);
      out.push({ ...c, src: abs });
      if (out.length >= 5) break;
    } catch {
      // skip invalid URLs
    }
  }
  return out;
}

function buildSkipMarker(org, reason, extra = {}) {
  return {
    organization_id: org.id,
    source: 'website_scrape',
    source_query: { url: extra.url || null, org_slug: org.slug },
    platform: 'web',
    raw_data: extra.raw_data || {},
    extracted_fields: {},
    confidence: 0,
    status: 'rejected',
    rejection_reason: reason,
    provenance: {
      script: 'alma-org-enrichment.mjs',
      skip_reason: reason,
      attempted_at: new Date().toISOString(),
      ...(extra.provenance || {}),
    },
  };
}

async function processOrg(org) {
  console.log(`\n→ ${org.name} (${org.slug})`);
  const websiteRaw = org.website_url || org.website;
  const homepage = normaliseUrl(websiteRaw);
  if (!homepage) {
    console.log('  · no usable website URL; skipping (marker written so we do not retry)');
    return buildSkipMarker(org, 'no_usable_url');
  }

  const fetchResult = await fetchPage(homepage);
  if (!fetchResult.body) {
    console.log('  · homepage fetch failed; skipping (marker written so we do not retry)');
    return buildSkipMarker(org, 'homepage_fetch_failed', {
      url: homepage,
      provenance: { fetch_strategy: fetchResult.strategy },
    });
  }
  const homepageHtml = fetchResult.body;
  const fetchStrategy = fetchResult.strategy;
  // Use whichever URL the fetch chain actually succeeded with — could be www
  // toggled or protocol swapped from the original.
  const effectiveHomepage = fetchStrategy?.succeeded_with?.final_url || fetchStrategy?.succeeded_with?.url || homepage;

  // Mine deeper pages. Start with sitemap.xml when present so we pick up
  // whatever paths the site actually uses (community orgs love putting
  // contact info on /staff, /our-team, /leadership, /people, /annual-report,
  // etc., which the canonical /contact-/about path list misses).
  const u = new URL(effectiveHomepage);
  const discoveredPaths = await discoverPathsFromSitemap(u);
  // Canonical path list as fallback / supplement to whatever sitemap gives us.
  const CANONICAL_PATHS = [
    '/contact',
    '/contact-us',
    '/about',
    '/about-us',
    '/team',
    '/our-team',
    '/staff',
    '/people',
    '/leadership',
    '/board',
    '/annual-report',
    '/annual-reports',
    '/reports',
    '/publications',
    '/our-story',
    '/history',
  ];
  // Merge sitemap + canonical, dedupe, cap to a polite number of fetches.
  // The hard cap protects us from sitemaps with 1000s of urls (some Wix sites).
  const allCandidates = [...new Set([...discoveredPaths, ...CANONICAL_PATHS])].slice(0, 10);

  let supplementary = '';
  for (const path of allCandidates) {
    try {
      const next = path.startsWith('http') ? path : new URL(path, u).href;
      // Only fetch same-host paths — avoid following sitemap entries that
      // point at CDNs or third-party hosts.
      if (new URL(next).hostname !== u.hostname) continue;
      await new Promise((r) => setTimeout(r, 1500));
      const inner = await fetchPage(next);
      if (inner.body) supplementary += `\n\n[FROM ${next}]\n` + stripHtml(inner.body).slice(0, 4000);
    } catch {
      // ignore
    }
  }

  const body = stripHtml(homepageHtml).slice(0, 6000) + supplementary;
  const logoCandidates = extractLogoCandidates(homepageHtml, effectiveHomepage);
  const logoBlock = logoCandidates.length
    ? `\n\nLogo candidate URLs found on this page (pick the most logo-like one for logo_url; prefer apple-touch-icon or og:image when present; if none look like a real org logo, set logo_url to null):\n${logoCandidates
        .map((c, i) => `${i + 1}. [${c.source}] ${c.src}`)
        .join('\n')}`
    : '';
  const userContent = `Organisation: ${org.name}\nWebsite: ${homepage}\nLocation: ${[org.suburb, org.city, org.state].filter(Boolean).join(', ') || 'unknown'}\n\nExpected output shape:\n${JSON.stringify(EXTRACTION_SCHEMA, null, 2)}${logoBlock}\n\nWebsite content:\n${body}`;

  const result = await callLLM(EXTRACTION_PROMPT, userContent);
  if (!result) {
    console.log('  · all LLM providers failed (marker written so we do not retry)');
    return buildSkipMarker(org, 'all_llm_providers_failed', { url: homepage });
  }

  const ext = result.json;

  // Resolve any URL fields the LLM returned as relative paths so the UI
  // doesn't try to load them from JusticeHub itself.
  function absolutise(u) {
    if (!u || typeof u !== 'string') return u;
    if (/^https?:\/\//i.test(u)) return u;
    try {
      return new URL(u, homepage).href;
    } catch {
      return u;
    }
  }
  ext.logo_url = absolutise(ext.logo_url);
  ext.annual_report_url = absolutise(ext.annual_report_url);

  // Validate the contact fields before they hit the candidate row.
  // Cheap checks only (regex + DNS MX lookup) — no SMTP probing.
  ext.email_validation = await validateEmail(ext.contact_email);
  ext.phone_validation = validatePhone(ext.contact_phone);
  // If the email is obviously broken (no MX, wrong format), drop the value
  // so a reviewer doesn't accidentally copy it into an outreach email.
  if (ext.contact_email && ext.email_validation.kind === 'invalid') {
    ext.contact_email_raw = ext.contact_email;
    ext.contact_email = null;
  }
  // If the phone fails format validation, keep the value but mark it.

  const fields = [
    ext.contact_email ? 'email' : null,
    ext.contact_phone ? 'phone' : null,
    ext.contact_name ? 'name' : null,
    ext.annual_report_url ? 'annual-report' : null,
    ext.logo_url ? 'logo' : null,
    ext.history_summary ? 'history' : null,
  ].filter(Boolean);

  // Identity check is now a structured boolean rather than free-text scan.
  // The LLM is asked first whether the page primarily represents the named
  // org. If false, we route to pending_data_repair regardless of how many
  // fields were extracted — those fields belong to a different entity.
  const identityMatch = ext.identity_match || {};
  const representsNamedOrg = identityMatch.represents_named_org !== false; // default true if missing
  const conf = typeof ext.confidence === 'number' ? ext.confidence : 0;

  // Drop zero-confidence / empty extractions when the identity check passes.
  // (A mismatch with extracted fields is still useful — it tells us what
  // the wrong website actually represents, and we want to repair the org
  // record, not just discard.)
  if (representsNamedOrg && (conf === 0 || fields.length === 0)) {
    console.log(`  · ${result.provider}: confidence=0 / no fields — marker written so we do not retry`);
    return buildSkipMarker(org, 'extraction_empty', {
      url: homepage,
      provenance: { llm_provider: result.provider, llm_model: result.model },
    });
  }

  const status = representsNamedOrg ? 'pending_review' : 'pending_data_repair';

  console.log(
    `  · ${result.provider}: confidence=${conf} · ${fields.join(', ') || 'no fields found'}${
      representsNamedOrg
        ? ''
        : ` · MISMATCH → data-repair lane (site represents: "${identityMatch.represented_entity_name || 'unknown'}")`
    }`
  );

  return {
    organization_id: org.id,
    source: 'website_scrape',
    source_query: { url: homepage, org_slug: org.slug },
    platform: 'web',
    raw_data: { homepage_excerpt: body.slice(0, 4000) },
    extracted_fields: ext,
    confidence: representsNamedOrg ? conf : 0,
    status,
    provenance: {
      llm_provider: result.provider,
      llm_model: result.model,
      fetched_at: new Date().toISOString(),
      script: 'alma-org-enrichment.mjs',
      represents_named_org: representsNamedOrg,
      represented_entity_name: identityMatch.represented_entity_name || null,
      identity_check_reason: identityMatch.reason || null,
      fetch_strategy: fetchStrategy,
      effective_url: effectiveHomepage !== homepage ? effectiveHomepage : null,
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
    .limit(Math.max(batchSize * 50, 5000));

  if (error) {
    console.error('Failed to fetch orgs:', error.message);
    process.exit(1);
  }

  const candidates = (orgs || []).filter((o) => (o.website_url || o.website || '').length > 0);

  // Fetch all recent candidates and filter in JS — using `.in(ids)` with
  // 1000+ UUIDs produces a URL >38KB that supabase-js silently fails on,
  // which made dedupe return 0 and re-attempt orgs we already processed.
  // Paginate in case the recent set ever exceeds Supabase's 1000-row cap.
  // When --retry-failed is set we exclude skip markers from dedupe so the
  // fetch hardening can take another swing at them.
  const FETCH_RETRY_REASONS = new Set([
    'homepage_fetch_failed',
    'extraction_empty',
    'all_llm_providers_failed',
  ]);
  const recentSet = new Set();
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  for (let from = 0; ; from += 1000) {
    const { data: existing, error: existingErr } = await supabase
      .from('alma_org_enrichment_candidates')
      .select('organization_id, status, rejection_reason')
      .eq('source', 'website_scrape')
      .gte('created_at', since)
      .range(from, from + 999);
    if (existingErr) {
      console.error('Dedupe fetch failed:', existingErr.message);
      process.exit(1);
    }
    if (!existing || existing.length === 0) break;
    for (const row of existing) {
      // If --retry-failed is set, don't count fetch-failure skip markers
      // toward dedupe. Anything else (pending_review, approved, rejected
      // for a non-fetch reason, pending_data_repair) still suppresses retry.
      if (retryFailed && row.status === 'rejected' && FETCH_RETRY_REASONS.has(row.rejection_reason)) {
        continue;
      }
      recentSet.add(row.organization_id);
    }
    if (existing.length < 1000) break;
  }
  const afterDedup = candidates.filter((c) => !recentSet.has(c.id));
  const dedupedOut = candidates.length - afterDedup.length;
  const todo = afterDedup.slice(0, batchSize);
  const trimmed = afterDedup.length - todo.length;

  console.log(
    `Found ${candidates.length} eligible orgs · ${dedupedOut} already have a candidate from the last 14 days · ${trimmed} held back by batch size · processing ${todo.length}${
      retryFailed ? ' · --retry-failed: previous skip markers ignored' : ''
    }.`
  );

  // Worker pool: `concurrency` orgs in flight at once. Each worker pulls
  // the next org off a shared queue and only quits when the queue is empty.
  // This is ~3-4× faster than the sequential loop because most of each org's
  // time is spent waiting on remote fetches, not on local CPU.
  const queue = [...todo];
  const results = [];
  let done = 0;
  const startTime = Date.now();
  async function worker(id) {
    while (queue.length > 0) {
      const org = queue.shift();
      if (!org) break;
      try {
        const c = await processOrg(org);
        if (c) results.push(c);
      } catch (e) {
        console.warn(`  · worker ${id} crashed on ${org.slug}: ${e.message}`);
      }
      done++;
      if (done % 10 === 0) {
        const rate = (done / ((Date.now() - startTime) / 1000)).toFixed(2);
        console.log(`  · progress ${done}/${todo.length} (${rate} orgs/s)`);
      }
      // small jitter so workers don't all hit the same host simultaneously
      await new Promise((r) => setTimeout(r, 100 + Math.random() * 200));
    }
  }
  console.log(`Running with concurrency=${concurrency}.`);
  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i + 1)));

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

  const CHUNK = 10;
  const insertedIds = [];
  const failedChunks = [];
  for (let i = 0; i < results.length; i += CHUNK) {
    const chunk = results.slice(i, i + CHUNK);
    let lastErr = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { error, data } = await supabase
          .from('alma_org_enrichment_candidates')
          .insert(chunk)
          .select('id, organization_id');
        if (error) {
          lastErr = error;
          // Non-network errors (constraint violations, RLS) won't be fixed by retry.
          if (!/fetch failed|ECONN|ETIMEDOUT|network|timeout/i.test(error.message)) break;
        } else {
          insertedIds.push(...(data || []).map((d) => d.id));
          lastErr = null;
          break;
        }
      } catch (e) {
        lastErr = e;
      }
      if (attempt < 3) {
        const wait = 1000 * Math.pow(2, attempt); // 2s, 4s
        console.warn(`  · chunk ${i / CHUNK + 1} insert attempt ${attempt} failed (${lastErr?.message?.slice(0, 80)}); retrying in ${wait}ms`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
    if (lastErr) {
      console.error(`  · chunk ${i / CHUNK + 1} (rows ${i}–${i + chunk.length - 1}) FAILED after 3 attempts: ${lastErr.message}`);
      failedChunks.push(chunk);
    }
  }

  if (failedChunks.length > 0) {
    const fs = await import('node:fs/promises');
    const salvagePath = `logs/alma-enrichment-salvage-${Date.now()}.json`;
    await fs.writeFile(salvagePath, JSON.stringify(failedChunks.flat(), null, 2));
    console.error(`\n${failedChunks.flat().length} candidates could not be inserted. Salvaged to ${salvagePath} — replay with a separate import script.`);
  }

  console.log(`\nInserted ${insertedIds.length} of ${results.length} candidates into alma_org_enrichment_candidates.`);
  console.log('Review them at /admin/alma/outreach-queue.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
