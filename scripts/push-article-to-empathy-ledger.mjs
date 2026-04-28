#!/usr/bin/env node
/**
 * Push a JusticeHub article to Empathy Ledger as a draft.
 *
 * Usage:
 *   node scripts/push-article-to-empathy-ledger.mjs <path-to-paste-ready-md> [--commit]
 *
 * The first H1 in the file becomes the title; everything after becomes content.
 * Always inserts as status=draft, is_public=false, has_explicit_consent=false.
 * Returns the EL editor URL.
 *
 * Mirrors the payload built by src/app/api/admin/empathy-ledger/articles/route.ts
 * so this script and the route stay in lockstep.
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv(p) {
  const out = {};
  try {
    for (const line of readFileSync(p, 'utf-8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq < 0) continue;
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      out[t.slice(0, eq).trim()] = v;
    }
  } catch {}
  return out;
}

// Inline copy of src/lib/empathy-ledger/markdown-to-html.ts so this CLI has no
// dependency on the next.js TS build.
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function inlineFormat(s) {
  return escapeHtml(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
}
function markdownToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let buf = [];
  let inQuote = false;

  function flush() {
    if (!buf.length) return;
    const text = buf.join(' ').trim();
    if (text) {
      if (inQuote) blocks.push(`<blockquote><p>${inlineFormat(text)}</p></blockquote>`);
      else blocks.push(`<p>${inlineFormat(text)}</p>`);
    }
    buf = [];
    inQuote = false;
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flush(); continue; }
    if (/^---+\s*$/.test(line)) { flush(); blocks.push('<hr />'); continue; }
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flush();
      blocks.push(`<h${heading[1].length}>${inlineFormat(heading[2])}</h${heading[1].length}>`);
      continue;
    }
    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      if (!inQuote) flush();
      inQuote = true;
      buf.push(quote[1]);
      continue;
    }
    if (inQuote) flush();
    buf.push(line);
  }
  flush();
  return blocks.join('\n');
}

// ── Args + env ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const filePath = args.find((a) => !a.startsWith('--'));
const COMMIT = args.includes('--commit');

if (!filePath) {
  console.error('Usage: node scripts/push-article-to-empathy-ledger.mjs <md-path> [--commit]');
  process.exit(1);
}

const env = { ...loadEnv(join(__dirname, '..', '.env.local')), ...process.env };
const EL_URL = env.EMPATHY_LEDGER_URL;
const EL_SERVICE_KEY = env.EMPATHY_LEDGER_SERVICE_KEY;
const EL_VIEW_BASE = (env.EMPATHY_LEDGER_V2_URL || 'https://www.empathyledger.com').replace(/\/+$/, '');

const DEFAULT_TENANT_ID = '8891e1a9-92ae-423f-928b-cec602660011';
const JH_DEFAULT_STORYTELLER_ID = '8b5f3aa0-5955-43ac-8442-37e48e7fc810'; // Benjamin Knight

if (!EL_URL || !EL_SERVICE_KEY) {
  console.error('Missing EMPATHY_LEDGER_URL or EMPATHY_LEDGER_SERVICE_KEY');
  process.exit(1);
}

// ── Read + parse the article ────────────────────────────────────────────────
const raw = readFileSync(filePath, 'utf-8');
const lines = raw.split('\n');
const titleIdx = lines.findIndex((l) => /^#\s+/.test(l));
if (titleIdx < 0) {
  console.error('No # H1 line found — paste-ready files must start with a # title.');
  process.exit(1);
}
const title = lines[titleIdx].replace(/^#\s+/, '').trim();
const bodyMd = lines.slice(titleIdx + 1).join('\n').trim();
const contentHtml = markdownToHtml(bodyMd);

// Pull a sensible summary from the first non-heading paragraph after the title.
const summaryMatch = bodyMd.split(/\n\s*\n/).find((p) => !/^#/.test(p.trim()) && p.trim().length > 60);
const summary = summaryMatch ? summaryMatch.trim().replace(/\s+/g, ' ').slice(0, 580) : null;

// ── Build payload (mirrors the API route exactly) ───────────────────────────
const insertId = randomUUID();
const themes = [
  'judges-on-country',
  'oonchiumpa',
  'youth-justice',
  'cultural-authority',
  'community-led-alternatives',
];
const tags = ['justicehub', 'jh-drafted', 'judges-on-country', 'imagination-architect-voice'];

const insertPayload = {
  id: insertId,
  tenant_id: DEFAULT_TENANT_ID,
  storyteller_id: JH_DEFAULT_STORYTELLER_ID, // option 1: Ben as primary
  title,
  content: contentHtml,
  summary,
  story_type: 'community_news',
  themes,
  tags,
  cultural_sensitivity_level: 'standard',
  privacy_level: 'private',
  is_public: false,
  status: 'draft',
  community_status: 'draft',
  story_stage: 'draft',
  language: 'en',
  has_explicit_consent: false,
  provenance_chain: [
    {
      source: 'justicehub_admin_draft',
      drafted_by: 'cli:push-article-to-empathy-ledger',
      drafted_at: new Date().toISOString(),
      note: `Drafted from ${filePath}`,
      voice: 'imagination-architect',
      sign_off_required: ['Kristy Bloomfield', 'Tanya Turner'],
    },
  ],
};

console.log('Mode:', COMMIT ? 'COMMIT' : 'DRY RUN');
console.log('File:', filePath);
console.log('Title:', title);
console.log('Body length:', contentHtml.length, 'chars');
console.log('Summary:', summary?.slice(0, 120) + '…');
console.log('Themes:', themes.join(', '));
console.log('Storyteller:', JH_DEFAULT_STORYTELLER_ID, '(Benjamin Knight)');
console.log('Target id:', insertId);

if (!COMMIT) {
  console.log('\nDry run. Re-run with --commit to push to EL.');
  process.exit(0);
}

const el = createClient(EL_URL, EL_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: story, error } = await el
  .from('stories')
  .insert(insertPayload)
  .select('id, title, status, created_at')
  .single();

if (error) {
  console.error('\nInsert failed:', error.message);
  console.error('Code:', error.code);
  console.error('Details:', error.details);
  process.exit(1);
}

console.log('\n✓ Draft created in Empathy Ledger:');
console.log('  Story id:', story.id);
console.log('  Status:', story.status);
console.log('  Created:', story.created_at);

const { error: themeErr } = await el
  .from('story_themes')
  .insert(themes.map((theme) => ({ story_id: insertId, theme })));
if (themeErr) {
  console.warn('  story_themes insert warning (non-fatal):', themeErr.message);
} else {
  console.log('  story_themes inserted:', themes.length, 'rows');
}

console.log('\nEdit URL:');
console.log('  ', `${EL_VIEW_BASE}/stories/write/${story.id}`);
console.log('\nNext steps:');
console.log('  1. Open the edit URL, swap in the founders hero image from the Oonchiumpa gallery.');
console.log('  2. Run the seven voice tests one more time on the rendered HTML.');
console.log('  3. Send the EL preview URL to Kristy and Tanya for review before publishing.');
