#!/usr/bin/env node
/**
 * Find any justice_matrix_cases / _campaigns rows without an embedding and
 * embed them. Same logic as the embed-new Vercel cron, but runnable locally.
 *
 * Usage: node scripts/justice-matrix-embed-new.mjs
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
if (!env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY required');
  process.exit(1);
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const BATCH = 40;

function caseText(c) {
  return [
    c.case_citation ?? '',
    c.jurisdiction ?? '',
    c.year ? String(c.year) : '',
    c.strategic_issue ?? '',
    c.key_holding ?? '',
  ].filter(Boolean).join(' | ').slice(0, 4000);
}

function campaignText(c) {
  return [
    c.campaign_name ?? '',
    c.country_region ?? '',
    c.start_year ? String(c.start_year) : '',
    c.goals ?? '',
    c.notable_tactics ?? '',
  ].filter(Boolean).join(' | ').slice(0, 4000);
}

async function embedBatch(texts) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: texts }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  return json.data.map((d) => d.embedding);
}

function toPgVec(arr) {
  return `[${arr.join(',')}]`;
}

async function topUp(table, cols, composeText) {
  const { data, error } = await supabase
    .from(table)
    .select(`id,${cols}`)
    .is('embedding', null)
    .limit(200);
  if (error) throw new Error(`${table}: ${error.message}`);
  const rows = data ?? [];
  if (!rows.length) {
    console.log(`${table}: nothing to embed`);
    return;
  }
  console.log(`${table}: embedding ${rows.length} rows`);
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const texts = slice.map(composeText);
    const vecs = await embedBatch(texts);
    for (let j = 0; j < slice.length; j++) {
      await supabase.from(table).update({ embedding: toPgVec(vecs[j]) }).eq('id', slice[j].id);
      done++;
    }
    console.log(`  ${done}/${rows.length}`);
  }
}

(async () => {
  await topUp(
    'justice_matrix_cases',
    'case_citation,jurisdiction,year,strategic_issue,key_holding',
    caseText,
  );
  await topUp(
    'justice_matrix_campaigns',
    'campaign_name,country_region,start_year,goals,notable_tactics',
    campaignText,
  );
  console.log('Done.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
