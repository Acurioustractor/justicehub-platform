#!/usr/bin/env node
/**
 * Score LinkedIn Commenters for Passion & Engagement
 *
 * Pattern-matches comments for:
 * - Substantive engagement (length)
 * - Offers to help
 * - Tagging others
 * - Expertise mentions
 * - Location mentions (demand signals)
 *
 * Usage:
 *   node scripts/score-engagement-passion.mjs
 *   node scripts/score-engagement-passion.mjs --dry-run
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
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

// Location patterns for demand mapping
const LOCATION_PATTERNS = [
  { pattern: /\b(adelaide|south australia|SA)\b/i, location: 'Adelaide' },
  { pattern: /\b(perth|western australia|WA)\b/i, location: 'Perth' },
  { pattern: /\b(melbourne|victoria|VIC)\b/i, location: 'Melbourne' },
  { pattern: /\b(sydney|new south wales|NSW)\b/i, location: 'Sydney' },
  { pattern: /\b(canberra|ACT)\b/i, location: 'Canberra' },
  { pattern: /\b(brisbane|queensland|QLD)\b/i, location: 'Brisbane' },
  { pattern: /\b(hobart|tasmania|tassie|TAS)\b/i, location: 'Hobart' },
  { pattern: /\b(darwin|northern territory|NT)\b/i, location: 'Darwin' },
  { pattern: /\b(FNQ|far north queensland|cairns|townsville)\b/i, location: 'FNQ' },
  { pattern: /\b(UK|united kingdom|london|england)\b/i, location: 'UK' },
  { pattern: /\b(US|united states|america)\b/i, location: 'US' },
];

const OFFER_KEYWORDS = /\b(help|support|donate|connect|host|involved|volunteer|contribute|partner|collaborate|happy to|would love to|keen to|want to help|count me in|sign me up)\b/i;
const EXPERTISE_KEYWORDS = /\b(\d+\s*years?|experience|worked in|ran|managed|directed|led|founded|specialise|specialize|expertise|profession|career)\b/i;
const TAG_PATTERN = /(?:^|\s)@?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g;

function extractComment(warmPaths) {
  if (!Array.isArray(warmPaths)) return null;
  for (const wp of warmPaths) {
    if (wp.via === 'linkedin_comment') {
      return wp.comment_snippet || wp.comment || null;
    }
    if (typeof wp === 'string') return wp;
  }
  return null;
}

function scoreComment(comment) {
  if (!comment || typeof comment !== 'string') {
    return { score: 0, signals: [] };
  }

  let score = 40; // Base: commented at all
  const signals = [{ type: 'engaged', snippet: 'Commented on post' }];

  // Substantive comment (>100 chars)
  if (comment.length > 100) {
    score += 20;
    signals.push({ type: 'substantive', snippet: `${comment.length} chars` });
  }

  // Offer keywords
  const offerMatch = comment.match(OFFER_KEYWORDS);
  if (offerMatch) {
    score += 15;
    signals.push({ type: 'offer', snippet: offerMatch[0] });
  }

  // Tags others
  const tagMatches = [...comment.matchAll(TAG_PATTERN)];
  if (tagMatches.length > 0) {
    score += 15;
    signals.push({ type: 'tags_others', snippet: tagMatches.map(m => m[1]).join(', ') });
  }

  // Expertise mention
  const expertiseMatch = comment.match(EXPERTISE_KEYWORDS);
  if (expertiseMatch) {
    score += 10;
    signals.push({ type: 'expertise', snippet: expertiseMatch[0] });
  }

  // Location mentions
  for (const { pattern, location } of LOCATION_PATTERNS) {
    if (pattern.test(comment)) {
      signals.push({ type: 'location_demand', snippet: location });
    }
  }

  return { score: Math.min(100, score), signals };
}

async function run() {
  console.log('=== Passion Scoring Engine ===\n');
  if (DRY_RUN) console.log('** DRY RUN — no writes **\n');

  // Fetch all entities with linkedin_comment warm paths
  const PAGE = 1000;
  let offset = 0;
  let allEntities = [];
  while (true) {
    const { data, error } = await supabase
      .from('campaign_alignment_entities')
      .select('id, name, warm_paths, organization, position')
      .not('warm_paths', 'is', null)
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`Fetch error: ${error.message}`);
    if (!data || data.length === 0) break;
    allEntities.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  console.log(`Found ${allEntities.length} entities with warm_paths\n`);

  // Filter to those with linkedin comments
  const withComments = allEntities.filter(e => {
    const comment = extractComment(e.warm_paths);
    return comment && comment.length > 0;
  });

  console.log(`${withComments.length} have LinkedIn comments\n`);

  const updates = [];
  const locationDemand = {};
  let offersCount = 0;

  for (const entity of withComments) {
    const comment = extractComment(entity.warm_paths);
    const { score, signals } = scoreComment(comment);

    updates.push({
      id: entity.id,
      passion_score: score,
      engagement_signals: signals,
    });

    // Track location demand
    for (const sig of signals) {
      if (sig.type === 'location_demand') {
        locationDemand[sig.snippet] = (locationDemand[sig.snippet] || 0) + 1;
      }
      if (sig.type === 'offer') offersCount++;
    }
  }

  // Sort by score desc
  updates.sort((a, b) => b.passion_score - a.passion_score);

  console.log('Score distribution:');
  const brackets = { '80-100': 0, '60-79': 0, '40-59': 0, '0-39': 0 };
  for (const u of updates) {
    if (u.passion_score >= 80) brackets['80-100']++;
    else if (u.passion_score >= 60) brackets['60-79']++;
    else if (u.passion_score >= 40) brackets['40-59']++;
    else brackets['0-39']++;
  }
  for (const [range, count] of Object.entries(brackets)) {
    console.log(`  ${range}: ${count}`);
  }

  console.log(`\nOffers to help: ${offersCount}`);
  console.log(`Location demand:`);
  const sortedLocations = Object.entries(locationDemand).sort((a, b) => b[1] - a[1]);
  for (const [loc, count] of sortedLocations) {
    console.log(`  ${loc}: ${count}`);
  }

  console.log(`\nTop 10 by passion score:`);
  for (const u of updates.slice(0, 10)) {
    const entity = withComments.find(e => e.id === u.id);
    console.log(`  ${u.passion_score} | ${entity.name} | ${entity.organization || 'n/a'}`);
  }

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] Would update ${updates.length} entities`);
    return;
  }

  // Batch update
  console.log(`\nUpdating ${updates.length} entities...`);
  const BATCH = 50;
  let updated = 0;
  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH);
    for (const item of batch) {
      const { error } = await supabase
        .from('campaign_alignment_entities')
        .update({
          passion_score: item.passion_score,
          engagement_signals: item.engagement_signals,
        })
        .eq('id', item.id);
      if (error) {
        console.warn(`  Failed to update ${item.id}: ${error.message}`);
      } else {
        updated++;
      }
    }
    if ((i + BATCH) % 200 === 0 || i + BATCH >= updates.length) {
      console.log(`  ${Math.min(i + BATCH, updates.length)}/${updates.length}`);
    }
  }

  console.log(`\n=== COMPLETE: ${updated} entities scored ===`);
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
