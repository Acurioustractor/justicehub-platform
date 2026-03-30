#!/usr/bin/env node
/**
 * Publish JusticeHub webflow articles to Empathy Ledger as stories.
 * All stories live in EL — JH syndicates from there.
 *
 * Usage:
 *   node scripts/publish-articles-to-el.mjs          # dry-run
 *   node scripts/publish-articles-to-el.mjs --commit  # actually insert
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const commit = process.argv.includes('--commit');

const el = createClient(
  process.env.EMPATHY_LEDGER_URL,
  process.env.EMPATHY_LEDGER_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const JH_ORG_ID = '0e878fa2-0b44-49b7-86d7-ecf169345582';
const JH_PROJECT_ID = '2e774118-d0a2-4c55-82f0-79c3027d2b58';
const CONTAINED_PROJECT_ID = '9b90b47c-2a4c-409c-97d5-3718aaf8c30c';
// JusticeHub storyteller (for articles authored by JH team)
const JH_STORYTELLER_ID = '48c32514-5762-4a44-bba5-5a7890b5e69f';

const ARTICLES_DIR = path.join(__dirname, '..', 'data', 'webflow-migration', 'articles-markdown');

// ── Parse frontmatter ─────────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta = {};
  let currentKey = null;
  let currentList = null;

  for (const line of match[1].split('\n')) {
    const kvMatch = line.match(/^(\w[\w_]*)\s*:\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();
      if (val === '') {
        currentList = [];
        meta[currentKey] = currentList;
      } else {
        meta[currentKey] = val.replace(/^["']|["']$/g, '');
        currentList = null;
      }
    } else if (currentList !== null && line.match(/^\s+-\s+/)) {
      currentList.push(line.replace(/^\s+-\s+/, '').trim());
    }
  }

  return { meta, body: match[2].trim() };
}

// ── Map category to story_type ────────────────────────────

function categoryToStoryType(category) {
  const map = {
    roots: 'community_story',
    growth: 'impact_story',
    harvest: 'advocacy',
    seeds: 'personal_narrative',
  };
  return map[category] || 'community_story';
}

// ── Map tags to themes ────────────────────────────────────

function tagsToThemes(tags) {
  if (!tags || !Array.isArray(tags)) return [];
  const themeMap = {
    'Youth-justice': 'youth_justice',
    'Community-led': 'community_resilience',
    'Indigenous-leadership': 'indigenous_leadership',
    'Elder-knowledge': 'cultural_preservation',
    'Lived-experience': 'lived_experience',
    'Mental-health': 'mental_health',
    'Systems-critique': 'advocacy',
    'Mentoring': 'mentoring',
    'Education': 'education',
    'Employment': 'employment',
    'Healing': 'healing',
    'Family': 'family',
    'Culture': 'cultural_preservation',
  };

  return tags.map(t => {
    const mapped = themeMap[t] || t.toLowerCase().replace(/-/g, '_');
    return { name: mapped };
  }).slice(0, 7); // EL themes array limit
}

// ── Check which project to link ───────────────────────────

function pickProjectId(tags, title) {
  const text = (title + ' ' + (tags || []).join(' ')).toLowerCase();
  if (text.includes('contained') || text.includes('tour') || text.includes('detention'))
    return CONTAINED_PROJECT_ID;
  return JH_PROJECT_ID;
}

// ── Main ──────────────────────────────────────────────────

async function main() {
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} articles in ${ARTICLES_DIR}\n`);

  // Check which slugs already exist in EL
  const { data: existing } = await el
    .from('stories')
    .select('title')
    .eq('organization_id', JH_ORG_ID);

  const existingTitles = new Set((existing || []).map(s => s.title));

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf-8');
    const { meta, body } = parseFrontmatter(raw);

    if (!meta.title) {
      console.log(`  SKIP ${file} — no title`);
      skipped++;
      continue;
    }

    if (existingTitles.has(meta.title)) {
      console.log(`  EXISTS ${meta.title.substring(0, 60)}...`);
      skipped++;
      continue;
    }

    const story = {
      title: meta.title,
      summary: meta.excerpt || body.substring(0, 200),
      content: body,
      story_type: categoryToStoryType(meta.category),
      themes: tagsToThemes(meta.tags),
      is_public: true,
      privacy_level: 'public',
      status: 'published',
      storyteller_id: JH_STORYTELLER_ID,
      organization_id: JH_ORG_ID,
      project_id: pickProjectId(meta.tags, meta.title),
      location: meta.location || null,
      published_at: meta.published_date ? new Date(meta.published_date).toISOString() : new Date().toISOString(),
      consent_status: 'approved',
      consent_type: 'organizational',
      consent_verified_at: new Date().toISOString(),
    };

    if (commit) {
      const { error } = await el.from('stories').insert(story);
      if (error) {
        console.log(`  ERROR ${meta.title.substring(0, 50)}: ${error.message}`);
        errors++;
      } else {
        console.log(`  CREATED ${meta.title.substring(0, 60)}`);
        created++;
      }
    } else {
      console.log(`  DRY-RUN ${meta.title.substring(0, 60)}`);
      created++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Created: ${created} | Skipped: ${skipped} | Errors: ${errors}`);
  if (!commit) console.log(`\nDry run. Add --commit to actually insert.`);
}

main().catch(console.error);
