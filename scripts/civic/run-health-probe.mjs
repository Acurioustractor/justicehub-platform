#!/usr/bin/env node
/**
 * Standalone runner for the source URL health probe.
 * Mirrors src/app/api/cron/data-sufficiency/health-probe/route.ts.
 *
 * Usage: node scripts/civic/run-health-probe.mjs [--apply]
 *   --apply: actually file gap questions for failures (default: dry-run)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const APPLY = process.argv.includes('--apply');
const PROBE_TIMEOUT_MS = 12_000;
const UA = 'JusticeHub-SourceHealthProbe/1.0';

async function probe(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    let res = await fetch(url, { method: 'HEAD', signal: ctrl.signal, headers: { 'User-Agent': UA }, redirect: 'follow' });
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: 'GET', signal: ctrl.signal, headers: { 'User-Agent': UA }, redirect: 'follow' });
    }
    return { status: res.status, ok: res.status >= 200 && res.status < 400 };
  } catch (err) {
    if (err?.name === 'AbortError') return { status: 0, ok: false, reason: 'timeout' };
    return { status: 0, ok: false, reason: err?.message || 'fetch error' };
  } finally { clearTimeout(t); }
}

async function main() {
  const { data: sources } = await supabase
    .from('data_sources_inventory')
    .select('source_key, display_name, topic, url, status')
    .in('status', ['active', 'planned'])
    .not('url', 'is', null);

  if (!sources || sources.length === 0) { console.log('No sources to probe.'); return; }
  console.log(`Probing ${sources.length} URLs...`);

  const failures = [];
  for (const s of sources) {
    const r = await probe(s.url);
    const tag = r.ok ? 'OK ' : 'BAD';
    console.log(`  [${tag}] ${r.status || r.reason || '?'} · ${s.source_key} · ${s.url}`);
    if (!r.ok) failures.push({ ...s, ...r });
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n${sources.length - failures.length}/${sources.length} OK · ${failures.length} failed`);

  if (failures.length === 0) return;
  if (!APPLY) {
    console.log('\nRe-run with --apply to file gap questions for failures.');
    return;
  }

  let created = 0;
  for (const f of failures) {
    const flagText = `Source URL not reachable: "${f.display_name}" (${f.status || 0}${f.reason ? ' ' + f.reason : ''}) — ${f.url}`;
    const { data: existing } = await supabase
      .from('data_gap_questions')
      .select('id')
      .eq('topic', f.topic)
      .eq('status', 'open')
      .ilike('question', `%${f.display_name}%not reachable%`)
      .maybeSingle();
    if (existing) continue;
    await supabase.from('data_gap_questions').insert({
      question: flagText,
      topic: f.topic,
      status: 'open',
      priority: 2,
      proposed_source_url: f.url,
      owner: 'agent:health-probe',
    });
    created++;
  }
  console.log(`Filed ${created} new gap questions.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
