#!/usr/bin/env node
/**
 * Scrape full text for alma_media_articles using Jina Reader API
 *
 * Fetches article content via https://r.jina.ai/{url} (free, no key needed),
 * extracts full_text, key_quotes, and organizations_mentioned.
 *
 * Usage:
 *   node scripts/scrape-article-fulltext.mjs              # dry-run (preview)
 *   node scripts/scrape-article-fulltext.mjs --apply       # write to DB
 *   node scripts/scrape-article-fulltext.mjs --apply --limit 20  # process 20 only
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
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 2000;
const JINA_TIMEOUT_MS = 30000;
const args = process.argv.slice(2);
const applyMode = args.includes('--apply');
const limitFlag = args.indexOf('--limit');
const maxArticles = limitFlag !== -1 ? parseInt(args[limitFlag + 1], 10) : Infinity;

// ── Jina Reader fetch ─────────────────────────────────────────
async function fetchArticleText(url) {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), JINA_TIMEOUT_MS);

  try {
    const res = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: { Accept: 'text/markdown' },
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
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
  return quotes.slice(0, 10); // cap at 10
}

// ── Extract organizations mentioned ───────────────────────────
function extractOrganizations(text) {
  // Match capitalized multi-word names (2-6 words), common org patterns
  const patterns = [
    /(?:the\s+)?(?:[A-Z][a-z]+(?:\s+(?:of|for|and|&|the)\s+)?){2,6}(?:Association|Foundation|Council|Commission|Corporation|Institute|Society|Centre|Center|Authority|Bureau|Department|Ministry|Service|Network|Alliance|Group|Trust|Fund|Committee|Board|Agency|Organisation|Organization|Program|Programme|Project|Coalition|Consortium|Partnership)/g,
    /(?:[A-Z]{2,}(?:\s+[A-Z]{2,})*)/g, // Acronyms like "AIHW" or "NSW BOCSAR"
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

  // Filter out common false positives
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
  console.log(`Limit: ${maxArticles === Infinity ? 'none' : maxArticles}\n`);

  // Fetch articles needing full_text
  const { data: articles, error } = await supabase
    .from('alma_media_articles')
    .select('id, headline, url')
    .is('full_text', null)
    .not('url', 'is', null)
    .order('published_date', { ascending: false })
    .limit(Math.min(maxArticles, 1000));

  if (error) { console.error('Query failed:', error.message); process.exit(1); }
  console.log(`Found ${articles.length} articles without full_text\n`);
  if (!articles.length) return;

  let success = 0, failed = 0, skipped = 0;

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(articles.length / BATCH_SIZE);
    console.log(`--- Batch ${batchNum}/${totalBatches} ---`);

    const results = await Promise.allSettled(
      batch.map(async (article) => {
        try {
          const markdown = await fetchArticleText(article.url);
          if (!markdown || markdown.length < 100) {
            console.log(`  SKIP  ${article.headline?.slice(0, 60)} (too short)`);
            skipped++;
            return;
          }

          const fullText = cleanMarkdown(markdown);
          const keyQuotes = extractQuotes(markdown);
          const orgsMentioned = extractOrganizations(fullText);

          console.log(`  OK    ${article.headline?.slice(0, 60)} (${fullText.length} chars, ${keyQuotes.length} quotes, ${orgsMentioned.length} orgs)`);

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
          console.log(`  FAIL  ${article.headline?.slice(0, 60)} - ${err.message}`);
          failed++;
        }
      })
    );

    // Delay between batches (skip after last)
    if (i + BATCH_SIZE < articles.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Success: ${success} | Failed: ${failed} | Skipped: ${skipped}`);
  if (!applyMode) console.log(`\nRe-run with --apply to write to database`);
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
