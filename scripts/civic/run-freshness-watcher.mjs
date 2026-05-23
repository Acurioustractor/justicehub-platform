#!/usr/bin/env node
/**
 * Standalone runner for the data-sufficiency freshness watcher.
 * Mirrors src/app/api/cron/data-sufficiency/freshness/route.ts.
 *
 * Usage: node scripts/civic/run-freshness-watcher.mjs [--apply]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const APPLY = process.argv.includes('--apply');

const CADENCE_DAYS = {
  daily: 2, weekly: 14, monthly: 45, quarterly: 120,
  biannual: 240, annual: 400, rolling: 30, planned: Infinity,
};

function staleThreshold(cadence) {
  if (!cadence) return 60;
  return CADENCE_DAYS[cadence.toLowerCase()] ?? 60;
}

async function main() {
  const { data: sources } = await supabase
    .from('data_sources_inventory')
    .select('source_key, display_name, topic, last_refreshed_at, refresh_cadence, status')
    .eq('status', 'active');

  if (!sources) { console.log('No active sources.'); return; }

  const alerts = [];
  for (const s of sources) {
    if (!s.last_refreshed_at) {
      alerts.push({ ...s, days_overdue: 'never refreshed' });
      continue;
    }
    const days = Math.floor((Date.now() - new Date(s.last_refreshed_at).getTime()) / 86_400_000);
    const threshold = staleThreshold(s.refresh_cadence);
    if (days > threshold) alerts.push({ ...s, days_overdue: days - threshold });
  }

  console.log(`${sources.length} active sources · ${alerts.length} overdue`);
  for (const a of alerts) {
    console.log(`  [${a.topic}] ${a.display_name} · ${typeof a.days_overdue === 'number' ? a.days_overdue + ' days past' : a.days_overdue}`);
  }

  if (!APPLY) {
    console.log('\nRe-run with --apply to file gap questions.');
    return;
  }

  let created = 0;
  for (const a of alerts) {
    const flagText = `Source "${a.display_name}" is overdue for refresh (${a.days_overdue} days past its ${a.refresh_cadence || 'default'} cadence)`;
    const { data: existing } = await supabase
      .from('data_gap_questions')
      .select('id')
      .eq('topic', a.topic)
      .eq('status', 'open')
      .ilike('question', `%${a.display_name}%overdue%`)
      .maybeSingle();
    if (existing) continue;
    await supabase.from('data_gap_questions').insert({
      question: flagText,
      topic: a.topic,
      status: 'open',
      priority: 3,
      owner: 'agent:freshness',
    });
    created++;
  }
  console.log(`Filed ${created} new gap questions.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
