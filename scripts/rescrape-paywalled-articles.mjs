#!/usr/bin/env node
/**
 * Re-scrape paywalled articles using Firecrawl API
 *
 * Firecrawl can bypass paywalls that Jina Reader cannot.
 * Targets alma_media_articles with NULL full_text and real URLs.
 *
 * Usage:
 *   node scripts/rescrape-paywalled-articles.mjs              # dry-run (preview)
 *   node scripts/rescrape-paywalled-articles.mjs --apply       # write to DB
 *   node scripts/rescrape-paywalled-articles.mjs --apply --limit 20
 *   node scripts/rescrape-paywalled-articles.mjs --apply --batch-size 10
 *   node scripts/rescrape-paywalled-articles.mjs --test        # test 3 articles only
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import FirecrawlApp from '@mendable/firecrawl-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── Load env ──────────────────────────────────────────────────
function loadEnv() {
  const env = { ...process.env };
  for (const name of ['.env.local', '.env']) {
    const p = join(root, name);
    if (existsSync(p)) {
      readFileSync(p, 'utf8')
        .split('\n')
        .filter((l) => l && !l.startsWith('#') && l.includes('='))
        .forEach((l) => {
          const eqIdx = l.indexOf('=');
          const key = l.slice(0, eqIdx).trim();
          const val = l.slice(eqIdx + 1).trim();
          if (!env[key]) env[key] = val;
        });
    }
  }
  return env;
}

const env = loadEnv();

if (!env.FIRECRAWL_API_KEY) {
  console.error('FIRECRAWL_API_KEY not found in .env.local or environment');
  process.exit(1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const firecrawl = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });

// ── CLI args ─────────────────────────────────────────────────
const args = process.argv.slice(2);
const applyMode = args.includes('--apply');
const testMode = args.includes('--test');
const limitFlag = args.indexOf('--limit');
const batchSizeFlag = args.indexOf('--batch-size');
const maxArticles = testMode ? 3 : (limitFlag !== -1 ? parseInt(args[limitFlag + 1], 10) : Infinity);
const BATCH_SIZE = batchSizeFlag !== -1 ? parseInt(args[batchSizeFlag + 1], 10) : 50;
const REQUEST_DELAY_MS = 2000; // 1 request per 2 seconds
const BATCH_DELAY_MS = 5000;   // 5 second pause between batches

// ── Firecrawl scrape ─────────────────────────────────────────
async function scrapeWithFirecrawl(url) {
  try {
    const result = await firecrawl.scrapeUrl(url, {
      formats: ['markdown'],
      onlyMainContent: true,
      timeout: 30000,
    });

    if (!result.success) {
      throw new Error(result.error || 'Scrape returned unsuccessful');
    }

    return result.markdown || '';
  } catch (err) {
    throw new Error(`Firecrawl: ${err.message}`);
  }
}

// ── Extract key quotes (blockquotes from markdown) ────────────
function extractQuotes(markdown) {
  const quotes = [];
  const lines = markdown.split('\n');
  let current = '';

  for (const line of lines) {
    if (line.startsWith('>')) {
      current += (current ? ' ' : '') + line.replace(/^>\s*/, '').trim();
    } else if (current) {
      if (current.length > 20) quotes.push(current);
      current = '';
    }
  }
  if (current && current.length > 20) quotes.push(current);
  return quotes.slice(0, 10);
}

// ── Extract organizations mentioned ───────────────────────────
function extractOrganizations(text) {
  const patterns = [
    /(?:the\s+)?(?:[A-Z][a-z]+(?:\s+(?:of|for|and|&|the)\s+)?){2,6}(?:Association|Foundation|Council|Commission|Corporation|Institute|Society|Centre|Center|Authority|Bureau|Department|Ministry|Service|Network|Alliance|Group|Trust|Fund|Committee|Board|Agency|Organisation|Organization|Program|Programme|Project|Coalition|Consortium|Partnership)/g,
    /(?:[A-Z]{2,}(?:\s+[A-Z]{2,})*)/g,
  ];

  const orgs = new Set();
  for (const pattern of patterns) {
    const matches = text.match(pattern) || [];
    for (const m of matches) {
      const cleaned = m.replace(/^the\s+/i, '').trim();
      if (cleaned.length > 4 && cleaned.length < 100) {
        orgs.add(cleaned);
      }
    }
  }

  const stopWords = new Set([
    'READ MORE', 'SHARE THIS', 'SIGN UP', 'LOG IN', 'CLICK HERE',
    'IMAGE', 'PHOTO', 'VIDEO', 'GETTY', 'CREDIT', 'SOURCE',
  ]);
  return [...orgs].filter((o) => !stopWords.has(o)).slice(0, 20);
}

// ── Clean markdown to plain-ish text ──────────────────────────
function cleanMarkdown(md) {
  return md
    .replace(/!\[.*?\]\(.*?\)/g, '')       // images
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // links -> text
    .replace(/#{1,6}\s*/g, '')             // headings
    .replace(/[*_]{1,3}/g, '')             // bold/italic
    .replace(/\n{3,}/g, '\n\n')            // excessive newlines
    .trim();
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log(`Mode: ${applyMode ? 'APPLY (writing to DB)' : 'DRY-RUN (preview only)'}`);
  console.log(`Test mode: ${testMode}`);
  console.log(`Limit: ${maxArticles === Infinity ? 'none' : maxArticles}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Delay: ${REQUEST_DELAY_MS}ms between requests\n`);

  // Fetch articles needing full_text (exclude example.com URLs)
  const { data: articles, error } = await supabase
    .from('alma_media_articles')
    .select('id, headline, url, source_name')
    .is('full_text', null)
    .not('url', 'is', null)
    .not('url', 'like', '%example.com%')
    .order('published_date', { ascending: false })
    .limit(Math.min(maxArticles, 1000));

  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }

  console.log(`Found ${articles.length} articles without full_text (excluding example.com)\n`);
  if (!articles.length) return;

  let success = 0, failed = 0, skipped = 0;
  const failures = [];

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(articles.length / BATCH_SIZE);
    console.log(`\n=== Batch ${batchNum}/${totalBatches} (${batch.length} articles) ===`);

    for (let j = 0; j < batch.length; j++) {
      const article = batch[j];
      const idx = i + j + 1;

      try {
        const markdown = await scrapeWithFirecrawl(article.url);

        if (!markdown || markdown.length < 100) {
          console.log(`  [${idx}/${articles.length}] SKIP  ${article.headline?.slice(0, 55)} (${markdown?.length || 0} chars - too short)`);
          skipped++;
          continue;
        }

        const fullText = cleanMarkdown(markdown);
        const keyQuotes = extractQuotes(markdown);
        const orgsMentioned = extractOrganizations(fullText);

        console.log(`  [${idx}/${articles.length}] OK    ${article.headline?.slice(0, 55)} (${fullText.length} chars, ${keyQuotes.length}q, ${orgsMentioned.length}o)`);

        if (applyMode) {
          const update = { full_text: fullText.slice(0, 50000) };
          if (keyQuotes.length) update.key_quotes = keyQuotes;
          if (orgsMentioned.length) update.organizations_mentioned = orgsMentioned;

          const { error: updateErr } = await supabase
            .from('alma_media_articles')
            .update(update)
            .eq('id', article.id);

          if (updateErr) throw new Error(`DB update: ${updateErr.message}`);
        }
        success++;
      } catch (err) {
        console.log(`  [${idx}/${articles.length}] FAIL  ${article.headline?.slice(0, 55)} - ${err.message}`);
        failures.push({ id: article.id, url: article.url, error: err.message });
        failed++;
      }

      // Rate limiting between requests (skip after last in batch)
      if (j < batch.length - 1) {
        await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
      }
    }

    // Delay between batches
    if (i + BATCH_SIZE < articles.length) {
      console.log(`  ... pausing ${BATCH_DELAY_MS / 1000}s before next batch ...`);
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Success: ${success} | Failed: ${failed} | Skipped: ${skipped}`);
  console.log(`Total processed: ${success + failed + skipped}/${articles.length}`);

  if (failures.length > 0 && failures.length <= 20) {
    console.log(`\nFailed URLs:`);
    for (const f of failures) {
      console.log(`  ${f.url} — ${f.error}`);
    }
  } else if (failures.length > 20) {
    console.log(`\n${failures.length} failures (too many to list). Top domains:`);
    const domainCounts = {};
    for (const f of failures) {
      const domain = new URL(f.url).hostname;
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    }
    Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([d, c]) => console.log(`  ${d}: ${c}`));
  }

  if (!applyMode) console.log(`\nRe-run with --apply to write to database`);
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
