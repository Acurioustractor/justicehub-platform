#!/usr/bin/env node
/**
 * Scrape LinkedIn Engagement — CONTAINED Campaign
 *
 * Extracts comments + reactions from LinkedIn post URLs.
 * Two modes:
 *   1. --cdp: Connects to your running Chrome via DevTools Protocol (full auth, all comments)
 *   2. Default: Uses browse CLI tool (public view, ~10 comments per post)
 *
 * Parses commenter profiles with LLM, scores for justice sector relevance,
 * and upserts to campaign_alignment_entities.
 *
 * Usage:
 *   # Full scrape (connect to your Chrome — needs Chrome launched with remote debugging):
 *   #   1. Quit Chrome completely
 *   #   2. Relaunch: /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
 *   #   3. Log into LinkedIn in Chrome
 *   #   4. Run:
 *   node scripts/scrape-linkedin-engagement.mjs --cdp --url "https://linkedin.com/posts/..."
 *
 *   # Quick scrape (public view, no auth needed):
 *   node scripts/scrape-linkedin-engagement.mjs --url "https://linkedin.com/posts/..."
 *
 *   # Multiple posts:
 *   node scripts/scrape-linkedin-engagement.mjs --cdp --posts posts.json
 *
 *   # Dry run:
 *   node scripts/scrape-linkedin-engagement.mjs --url "..." --dry-run
 */
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter(l => l && !l.startsWith('#') && l.includes('='))
      .forEach(l => {
        const eqIdx = l.indexOf('=');
        const key = l.slice(0, eqIdx).trim();
        const val = l.slice(eqIdx + 1).trim();
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}
const env = loadEnv();

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DRY_RUN = process.argv.includes('--dry-run');
const USE_CDP = process.argv.includes('--cdp');
const CDP_PORT = (() => {
  const idx = process.argv.indexOf('--cdp-port');
  return idx !== -1 ? parseInt(process.argv[idx + 1]) : 9222;
})();

function getPostUrls() {
  const urlIdx = process.argv.indexOf('--url');
  const postsIdx = process.argv.indexOf('--posts');
  if (urlIdx !== -1 && process.argv[urlIdx + 1]) return [process.argv[urlIdx + 1]];
  if (postsIdx !== -1 && process.argv[postsIdx + 1]) {
    const data = JSON.parse(readFileSync(process.argv[postsIdx + 1], 'utf8'));
    return Array.isArray(data) ? data : data.urls || data.posts || [];
  }
  return [];
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Browse CLI wrapper (for public view fallback) ───────────────────────────

function findBrowseBin() {
  const paths = [
    join(process.env.HOME || '', '.claude/skills/gstack/browse/bin/find-browse'),
  ];
  for (const p of paths) {
    try {
      const result = execSync(p, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}` } });
      const bin = result.split('\n')[0].trim();
      if (bin) return bin;
    } catch { /* skip */ }
  }
  return null;
}

let BROWSE_BIN;

function browse(command) {
  if (!BROWSE_BIN) BROWSE_BIN = findBrowseBin();
  if (!BROWSE_BIN) throw new Error('Browse tool not found');
  const envWithBun = { ...process.env, PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}` };
  return execSync(`${BROWSE_BIN} ${command}`, { encoding: 'utf8', timeout: 60000, env: envWithBun }).trim();
}

// ─── LLM Helper ──────────────────────────────────────────────────────────────

async function callLLM(prompt, systemPrompt = '') {
  const providers = [
    { key: env.GROQ_API_KEY, url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile' },
    { key: env.GEMINI_API_KEY, url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', model: 'gemini-2.5-flash' },
  ];

  for (const provider of providers) {
    if (!provider.key) continue;
    try {
      const messages = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: prompt });

      const res = await fetch(provider.url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${provider.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: provider.model, messages, max_tokens: 4096, temperature: 0.1, response_format: { type: 'json_object' } }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      return (data.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    } catch { continue; }
  }
  throw new Error('No LLM provider available (need GROQ_API_KEY or GEMINI_API_KEY)');
}

// ─── CDP Scraper (connects to your real Chrome) ──────────────────────────────

async function scrapePostCDP(postUrl) {
  console.log(`\n  Connecting to Chrome on port ${CDP_PORT}...`);

  let browser;
  try {
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  } catch (e) {
    console.error(`\n  ERROR: Cannot connect to Chrome DevTools on port ${CDP_PORT}.`);
    console.error('  Make sure Chrome is running with remote debugging:');
    console.error(`  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=${CDP_PORT}\n`);
    throw e;
  }

  const contexts = browser.contexts();
  const context = contexts[0];
  const page = await context.newPage();

  try {
    console.log(`  Navigating to: ${postUrl}`);
    await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);

    // Check if logged in
    const url = page.url();
    if (url.includes('/login') || url.includes('/authwall')) {
      console.error('  Not logged in! Log into LinkedIn in Chrome first.');
      return { commenters: [], reactionCount: 0, postUrl };
    }

    // Wait for comments section — supports both old and new LinkedIn DOM
    console.log('  Waiting for comments...');
    await page.waitForSelector('.comment, .comments-comments-list, .comments-comment-item', { timeout: 15000 }).catch(() => {});
    await sleep(2000);

    // Load ALL comments by clicking "Load more" repeatedly
    console.log('  Loading all comments...');
    let loadAttempts = 0;
    while (loadAttempts < 20) {
      const loadMoreBtn = await page.$('button[aria-label*="Load more comments"]')
        || await page.$('button[aria-label*="more comments"]')
        || await page.$('button[aria-label*="Load more"]')
        || await page.$('.comments-comment-list__load-more-container button')
        || await page.$('button.comments-comments-list__load-more-comments-button');

      if (!loadMoreBtn) break;

      try {
        await loadMoreBtn.click();
      } catch {
        // Button may detach from DOM after click — that's fine
        break;
      }
      await sleep(1500);
      loadAttempts++;

      const count = await page.$$eval(
        '.comment, article.comments-comment-item, div.comments-comment-entity',
        els => els.length
      );
      process.stdout.write(`\r  Loaded ${count} comments...`);
    }
    console.log('');

    // Also expand "See previous replies"
    let replyAttempts = 0;
    while (replyAttempts < 10) {
      const prevBtn = await page.$('button[aria-label*="previous replies"]')
        || await page.$('button.show-prev-replies')
        || await page.$('button.comment__reply');
      if (!prevBtn) break;
      await prevBtn.click();
      await sleep(1000);
      replyAttempts++;
    }

    // Extract all commenters — supports both old and new LinkedIn DOM
    console.log('  Extracting commenters...');
    const commenters = await page.evaluate(() => {
      const results = [];
      const seen = new Set();

      // Try NEW LinkedIn DOM first (.comment), then OLD (.comments-comment-entity)
      let commentEls = document.querySelectorAll('.comment.comment-with-action');
      let isNewDOM = commentEls.length > 0;

      if (!isNewDOM) {
        commentEls = document.querySelectorAll('.comment');
        isNewDOM = commentEls.length > 0;
      }

      if (!isNewDOM) {
        // Fall back to old DOM
        commentEls = document.querySelectorAll('.comments-comment-entity');
      }

      for (const el of commentEls) {
        let name, headline, profileUrl, comment, isReply;

        if (isNewDOM) {
          // NEW LinkedIn DOM (2026+)
          const nameEl = el.querySelector('.comment__author');
          name = (nameEl?.textContent || '').trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');

          const headlineEl = el.querySelector('.comment__author-headline');
          headline = (headlineEl?.textContent || '').trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');

          const profileLink = el.querySelector('a[href*="/in/"]');
          profileUrl = (profileLink?.href || '').split('?')[0];

          const textEl = el.querySelector('.comment__text');
          comment = (textEl?.textContent || '').trim().substring(0, 500);

          isReply = el.classList.contains('comment__reply') || el.closest('.comment__reply') !== null;
        } else {
          // OLD LinkedIn DOM
          isReply = el.classList.contains('comments-comment-entity--reply');

          const nameEl = el.querySelector('.comments-comment-meta__description-title');
          name = (nameEl?.textContent || '').trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');

          const headlineEl = el.querySelector('.comments-comment-meta__description-subtitle');
          headline = (headlineEl?.textContent || '').trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');

          const profileLink = el.querySelector('a.comments-comment-meta__image-link, a[href*="/in/"]');
          profileUrl = (profileLink?.href || '').split('?')[0];

          const textEl = el.querySelector('.comments-comment-item__main-content');
          comment = (textEl?.textContent || '').trim().substring(0, 500);
        }

        if (!name || seen.has(name)) continue;
        seen.add(name);
        results.push({ name, headline, profileUrl, comment, isReply });
      }
      return results;
    });

    // Reaction count — supports both old and new DOM
    const reactionCount = await page.evaluate(() => {
      // New DOM
      const newEl = document.querySelector('[class*="reactions-count"]');
      if (newEl) return parseInt(newEl.textContent.replace(/[^0-9]/g, '') || '0');
      // Old DOM
      const oldEl = document.querySelector('.social-details-social-counts__reactions-count');
      if (oldEl) return parseInt(oldEl.textContent.replace(/[^0-9]/g, '') || '0');
      return 0;
    });

    console.log(`  Found ${commenters.length} unique commenters, ${reactionCount} reactions`);
    return { commenters, reactionCount, postUrl };

  } finally {
    await page.close();
    // Don't close browser — it's the user's Chrome
  }
}

// ─── Browse Scraper (public view, no auth) ───────────────────────────────────

async function scrapePostBrowse(postUrl) {
  console.log(`\n  Navigating to: ${postUrl}`);
  browse(`goto "${postUrl}"`);
  await sleep(3000);

  console.log('  Extracting commenters...');
  const rawCommenters = browse(`js "
    var comments = document.querySelectorAll('.comment');
    var data = [];
    comments.forEach(function(el) {
      var author = el.querySelector('.comment__author');
      var text = el.querySelector('.comment__text');
      var link = el.querySelector('a[href*=\\"/in/\\"]');
      data.push({
        name: (author ? author.textContent : '').trim(),
        profileUrl: (link ? link.href : '').split('?')[0],
        comment: (text ? text.textContent : '').trim().substring(0, 500)
      });
    });
    JSON.stringify(data)
  "`);

  let commenters;
  try {
    commenters = JSON.parse(rawCommenters);
  } catch {
    commenters = [];
  }

  const rawReactions = browse(`js "
    var el = document.querySelector('[class*=\\"reaction\\"]');
    var text = el ? el.textContent.trim() : '';
    var match = text.match(/([0-9,]+)/);
    match ? match[1] : '0'
  "`);
  const reactionCount = parseInt((rawReactions || '0').replace(/,/g, ''));

  console.log(`  Found ${commenters.length} commenters, ${reactionCount} reactions`);
  return { commenters, reactionCount, postUrl };
}

// ─── Enrich with profile data (browse only, CDP already has headlines) ───────

async function enrichWithProfiles(commenters) {
  const enriched = [];
  for (const c of commenters) {
    if (c.headline) {
      // Already have headline from CDP mode
      enriched.push(c);
      continue;
    }
    if (c.profileUrl && c.profileUrl.includes('/in/')) {
      try {
        console.log(`    Fetching profile: ${c.name}`);
        browse(`goto "${c.profileUrl}"`);
        await sleep(2000);
        const profileData = browse(`js "
          var headline = document.querySelector('.top-card-layout__headline, h2.top-card-layout__headline');
          JSON.stringify({ headline: headline ? headline.textContent.trim() : '' })
        "`);
        const parsed = JSON.parse(profileData);
        enriched.push({ ...c, headline: parsed.headline });
      } catch {
        enriched.push(c);
      }
    } else {
      enriched.push(c);
    }
  }
  return enriched;
}

// ─── LLM Parse ───────────────────────────────────────────────────────────────

async function parseHeadlines(commenters) {
  if (commenters.length === 0) return [];

  // Process in batches of 20 for LLM
  const allResults = [];
  const BATCH = 20;

  for (let i = 0; i < commenters.length; i += BATCH) {
    const batch = commenters.slice(i, i + BATCH);
    const entries = batch.map((c, j) => {
      const idx = i + j + 1;
      const parts = [`${idx}. ${c.name}`];
      if (c.headline) parts.push(`headline: "${c.headline}"`);
      if (c.comment) parts.push(`comment: "${c.comment.substring(0, 100)}"`);
      return parts.join(' | ');
    }).join('\n');

    const prompt = `Parse these LinkedIn commenters into structured data. Use their headline if available, otherwise infer from their name and comment text. For each person, determine:
- role: their job title or role
- organization: the organization they work for
- sector: one of: justice, community_services, government, philanthropy, education, health, media, legal, arts, corporate, other

Return JSON: { "results": [{ "index": N, "role": "...", "organization": "...", "sector": "..." }, ...] }

People:
${entries}`;

    try {
      const result = await callLLM(prompt, 'You parse LinkedIn profiles into structured data. Return valid JSON only.');
      const parsed = JSON.parse(result);
      allResults.push(...(parsed.results || []));
    } catch (e) {
      console.warn(`  LLM batch ${i}-${i + BATCH} failed: ${e.message}`);
      batch.forEach((c, j) => allResults.push({ index: i + j + 1, role: c.headline || '', organization: '', sector: 'other' }));
    }
  }
  return allResults;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

const SECTOR_SCORES = {
  justice: 90, government: 85, legal: 80, community_services: 75,
  philanthropy: 70, education: 50, arts: 50, health: 45,
  media: 40, corporate: 30, other: 30,
};

const ROLE_PATTERNS = [
  { pattern: /minister|secretary|premier|attorney.general|mp|member.of.parliament/i, score: 90 },
  { pattern: /ceo|chief|director|executive.director|managing|founder/i, score: 70 },
  { pattern: /head.of|vp|vice.president|general.manager|professor/i, score: 65 },
  { pattern: /manager|lead|senior|principal|phd|dr\b/i, score: 50 },
  { pattern: /coordinator|officer|advisor|consultant/i, score: 40 },
  { pattern: /researcher|analyst|specialist|teacher/i, score: 35 },
];

function scoreCommenter(commenter, parsed) {
  const sector = parsed?.sector || 'other';
  const justiceAlignmentScore = SECTOR_SCORES[sector] || 30;

  let reachInfluenceScore = 30;
  const role = parsed?.role || commenter.headline || '';
  for (const { pattern, score } of ROLE_PATTERNS) {
    if (pattern.test(role)) { reachInfluenceScore = score; break; }
  }

  const accessibilityScore = commenter.comment ? 80 : 40;
  const compositeScore = Math.round(justiceAlignmentScore * 0.4 + reachInfluenceScore * 0.3 + accessibilityScore * 0.3);

  return { justiceAlignmentScore, reachInfluenceScore, accessibilityScore, compositeScore };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const postUrls = getPostUrls();
  if (postUrls.length === 0) {
    console.error('Usage:');
    console.error('  # Full scrape (all comments, needs Chrome with remote debugging):');
    console.error('  node scripts/scrape-linkedin-engagement.mjs --cdp --url "https://linkedin.com/posts/..."');
    console.error('');
    console.error('  # Quick scrape (public view, ~10 comments):');
    console.error('  node scripts/scrape-linkedin-engagement.mjs --url "https://linkedin.com/posts/..."');
    process.exit(1);
  }

  console.log(`\n=== Scrape LinkedIn Engagement — CONTAINED Campaign ===`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'} | Engine: ${USE_CDP ? 'Chrome CDP (full)' : 'Browse (public view)'}`);
  console.log(`Posts: ${postUrls.length}\n`);

  if (USE_CDP) {
    // Verify Chrome is reachable, or launch it
    try {
      const resp = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      const info = await resp.json();
      console.log(`Connected to: ${info.Browser}`);
    } catch {
      console.log(`Chrome not running on port ${CDP_PORT}, launching...`);
      const { spawn } = await import('child_process');
      const userDataDir = join(root, '.chrome-debug-profile');
      const chromeArgs = [
        `--remote-debugging-port=${CDP_PORT}`,
        `--user-data-dir=${userDataDir}`,
      ];
      const chrome = spawn(
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        chromeArgs,
        { detached: true, stdio: 'ignore' }
      );
      chrome.unref();
      console.log('  Chrome launched. Waiting for it to start...');

      // Wait for Chrome to be ready
      let ready = false;
      for (let i = 0; i < 15; i++) {
        await sleep(1000);
        try {
          const resp = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
          const info = await resp.json();
          console.log(`  Connected to: ${info.Browser}`);
          ready = true;
          break;
        } catch { /* waiting */ }
      }
      if (!ready) {
        console.error('  Chrome failed to start. Try manually:');
        console.error(`  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=${CDP_PORT} --user-data-dir=${userDataDir}`);
        process.exit(1);
      }

      // Check if LinkedIn is logged in, if not prompt user
      const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
      const ctx = browser.contexts()[0];
      const testPage = await ctx.newPage();
      await testPage.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(2000);
      const testUrl = testPage.url();
      await testPage.close();

      if (testUrl.includes('/login') || testUrl.includes('/authwall') || testUrl.includes('/signup')) {
        console.log('\n  Chrome opened but not logged into LinkedIn.');
        console.log('  Log into LinkedIn in the Chrome window, then press Enter here...\n');
        await new Promise(resolve => process.stdin.once('data', resolve));
      }
    }
  }

  const allEngagements = [];

  for (const postUrl of postUrls) {
    const { commenters, reactionCount } = USE_CDP
      ? await scrapePostCDP(postUrl)
      : await scrapePostBrowse(postUrl);

    if (commenters.length === 0) {
      console.log('  No commenters found');
      continue;
    }

    // Enrich profiles (browse mode only — CDP already has headlines)
    let enriched = commenters;
    if (!USE_CDP && commenters.some(c => !c.headline)) {
      console.log('  Enriching with profile data...');
      enriched = await enrichWithProfiles(commenters);
    }

    // Parse with LLM
    console.log(`  Parsing ${enriched.length} commenters with LLM...`);
    const parsedHeadlines = await parseHeadlines(enriched);

    for (let i = 0; i < enriched.length; i++) {
      const commenter = enriched[i];
      const parsed = parsedHeadlines.find(p => p.index === i + 1) || {};
      const scores = scoreCommenter(commenter, parsed);
      allEngagements.push({ ...commenter, parsed, scores, postUrl, engagementType: 'comment' });
    }

    if (postUrls.indexOf(postUrl) < postUrls.length - 1) {
      console.log('  Waiting 2s...');
      await sleep(2000);
    }
  }

  console.log(`\nTotal engagements scraped: ${allEngagements.length}`);
  if (allEngagements.length === 0) { console.log('Nothing to process.'); return; }

  // Deduplicate
  const deduped = new Map();
  for (const eng of allEngagements) {
    const key = eng.name.toLowerCase();
    if (!deduped.has(key) || eng.comment) deduped.set(key, eng);
  }
  const unique = [...deduped.values()];
  console.log(`Unique commenters: ${unique.length}`);

  // Build entities
  console.log('\nBuilding entities...');
  const entities = unique.map(eng => {
    const { scores, parsed } = eng;
    const alignmentCategory = scores.justiceAlignmentScore > 50 ? 'potential_ally'
      : scores.justiceAlignmentScore > 20 ? 'neutral' : 'unknown';

    return {
      entity_type: 'person',
      name: eng.name,
      organization: parsed.organization || null,
      organization_name: parsed.organization || null,
      position: parsed.role || null,
      email: null,
      justice_alignment_score: scores.justiceAlignmentScore,
      reach_influence_score: scores.reachInfluenceScore,
      accessibility_score: scores.accessibilityScore,
      composite_score: scores.compositeScore,
      alignment_category: alignmentCategory,
      campaign_list: 'allies_to_activate',
      alignment_signals: [
        { type: 'linkedin_engagement', detail: 'Commented on CONTAINED post' },
        { type: 'sector', detail: `Sector: ${parsed.sector || 'unknown'}` },
        { type: 'role', detail: `Role: ${parsed.role || eng.headline || 'unknown'}` },
      ],
      warm_paths: [{
        via: 'linkedin_comment',
        post_url: eng.postUrl,
        comment_snippet: (eng.comment || '').slice(0, 200),
        profile_url: eng.profileUrl,
      }],
      funding_history: [],
      outreach_status: 'pending',
      score_confidence: parsed.sector && parsed.sector !== 'other' ? 'medium' : 'low',
      last_scored_at: new Date().toISOString(),
    };
  });

  // Print results
  const sorted = [...entities].sort((a, b) => b.composite_score - a.composite_score);
  console.log('\nTop engagements by score:');
  for (const e of sorted.slice(0, 20)) {
    console.log(`  ${String(e.composite_score).padStart(3)} | ${e.alignment_category.padEnd(14)} | ${e.name.padEnd(30)} | ${e.position || 'unknown'}`);
  }

  // Save JSON
  const outputDir = join(root, 'output');
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  const date = new Date().toISOString().split('T')[0];
  const jsonPath = join(outputDir, `linkedin-engagement-${date}.json`);
  writeFileSync(jsonPath, JSON.stringify({ scraped_at: new Date().toISOString(), posts: postUrls, engagements: entities }, null, 2));
  console.log(`\nJSON saved: ${jsonPath}`);

  // Upsert
  if (!DRY_RUN) {
    console.log(`\nUpserting ${entities.length} entities...`);
    let inserted = 0, updated = 0, errors = 0;
    for (const entity of entities) {
      const { data: existing } = await supabase
        .from('campaign_alignment_entities')
        .select('id')
        .eq('name', entity.name)
        .eq('entity_type', 'person')
        .limit(1);

      if (existing && existing.length > 0) {
        const { error } = await supabase
          .from('campaign_alignment_entities')
          .update({ ...entity, updated_at: new Date().toISOString() })
          .eq('id', existing[0].id);
        if (error) { console.warn(`  ERR: ${error.message}`); errors++; } else updated++;
      } else {
        const { error } = await supabase
          .from('campaign_alignment_entities')
          .insert(entity);
        if (error) { console.warn(`  ERR: ${error.message}`); errors++; } else inserted++;
      }
    }
    console.log(`  Inserted: ${inserted}, Updated: ${updated}, Errors: ${errors}`);
  } else {
    console.log(`\n[DRY RUN] Would upsert ${entities.length} entities`);
  }

  // Summary
  console.log('\n=== Summary ===');
  const byCategory = {};
  for (const e of entities) byCategory[e.alignment_category] = (byCategory[e.alignment_category] || 0) + 1;
  console.log(`Total unique commenters: ${entities.length}`);
  console.log(`By category:`, JSON.stringify(byCategory));
  console.log(`Avg composite score: ${Math.round(entities.reduce((s, e) => s + e.composite_score, 0) / entities.length)}`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
