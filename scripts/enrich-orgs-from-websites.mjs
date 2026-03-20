#!/usr/bin/env node
/**
 * Enrich organizations by scraping their websites for descriptions.
 * Targets orgs that have a website but no description.
 *
 * Usage: node scripts/enrich-orgs-from-websites.mjs [--dry-run] [--limit N]
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sb = createClient(
  'https://tednluwflfhxyucgwigh.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const DRY_RUN = process.argv.includes('--dry-run');
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1]) : 9999;

// Timeout for each fetch
const FETCH_TIMEOUT = 8000;
const DELAY_MS = 300; // Rate limit: ~3 req/sec

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Skip URLs that aren't actual org websites
const SKIP_DOMAINS = [
  'modernslaveryregister.gov.au',
  'acnc.gov.au',
  'abr.business.gov.au',
  'abn.business.gov.au',
];

// Reject descriptions that are generic/boilerplate
const REJECT_PATTERNS = [
  /modern slavery/i,
  /^this (website|site|page)/i,
  /^welcome to our (website|site)/i,
  /cookie (policy|notice|consent)/i,
  /^javascript (is|must be) enabled/i,
];

function cleanUrl(url) {
  if (!url) return null;
  let u = url.trim();
  if (!u.startsWith('http')) u = 'https://' + u;
  try {
    const parsed = new URL(u);
    // Skip non-org websites
    if (SKIP_DOMAINS.some(d => parsed.hostname.includes(d))) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function extractDescription(html) {
  if (!html || html.length < 100) return null;

  // 1. Try meta description
  const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']{20,500})["']/i)
    || html.match(/<meta[^>]*content=["']([^"']{20,500})["'][^>]*name=["']description["']/i);
  if (metaDesc?.[1]) return cleanText(metaDesc[1]);

  // 2. Try og:description
  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']{20,500})["']/i)
    || html.match(/<meta[^>]*content=["']([^"']{20,500})["'][^>]*property=["']og:description["']/i);
  if (ogDesc?.[1]) return cleanText(ogDesc[1]);

  // 3. Try first meaningful <p> tag (skip nav/header boilerplate)
  const pTags = html.match(/<p[^>]*>([^<]{30,500})<\/p>/gi);
  if (pTags) {
    for (const p of pTags.slice(0, 10)) {
      const text = p.replace(/<[^>]+>/g, '').trim();
      if (text.length >= 30 && !text.match(/cookie|privacy|accept|subscribe|newsletter|sign up|log in/i)) {
        return cleanText(text);
      }
    }
  }

  return null;
}

function cleanText(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JusticeHub/1.0; +https://www.justicehub.com.au)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    if (!resp.ok) return null;
    const contentType = resp.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return null;
    // Only read first 50KB
    const reader = resp.body.getReader();
    const chunks = [];
    let totalSize = 0;
    while (totalSize < 50000) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalSize += value.length;
    }
    reader.cancel();
    return new TextDecoder().decode(Buffer.concat(chunks.map(c => Buffer.from(c))));
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  console.log(`Website description enrichment${DRY_RUN ? ' (DRY RUN)' : ''}`);
  console.log('---');

  // Get orgs with website but no description
  const { data: orgs } = await sb
    .from('organizations')
    .select('id, name, website')
    .eq('is_active', true)
    .is('description', null)
    .not('website', 'is', null)
    .order('name')
    .limit(LIMIT);

  console.log(`Found ${orgs?.length || 0} orgs with website but no description\n`);
  if (!orgs?.length) return;

  let enriched = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < orgs.length; i++) {
    const org = orgs[i];
    const url = cleanUrl(org.website);
    if (!url) {
      skipped++;
      continue;
    }

    const html = await fetchPage(url);
    if (!html) {
      failed++;
      if (failed <= 5) console.log(`  FAIL: ${org.name} (${url})`);
      await sleep(DELAY_MS);
      continue;
    }

    let description = extractDescription(html);
    if (description && REJECT_PATTERNS.some(p => p.test(description))) description = null;
    if (!description || description.length < 20) {
      skipped++;
      await sleep(DELAY_MS);
      continue;
    }

    if (!DRY_RUN) {
      await sb.from('organizations').update({ description }).eq('id', org.id);
    }
    enriched++;
    if (enriched <= 20) {
      console.log(`  ✓ ${org.name}: "${description.substring(0, 80)}..."`);
    }

    // Progress every 100
    if ((i + 1) % 100 === 0) {
      console.log(`  Progress: ${i + 1}/${orgs.length} (${enriched} enriched, ${failed} failed, ${skipped} skipped)`);
    }

    await sleep(DELAY_MS);
  }

  console.log('\nResults:');
  console.log(`  Total processed: ${orgs.length}`);
  console.log(`  Enriched: ${enriched}`);
  console.log(`  Failed (timeout/error): ${failed}`);
  console.log(`  Skipped (no usable description): ${skipped}`);
}

main().catch(console.error);
