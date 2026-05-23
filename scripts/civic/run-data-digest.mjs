#!/usr/bin/env node
/**
 * Generates a readable digest of the last 24 hours of data-sufficiency
 * activity: new agent findings (pending review), new gap questions
 * (especially from agent:freshness or agent:health-probe), classifier
 * advances, source refreshes.
 *
 * Writes to thoughts/shared/data-sufficiency-digest-YYYY-MM-DD.md.
 *
 * Usage: node scripts/civic/run-data-digest.mjs [--hours 24]
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const HOURS_ARG = process.argv.find((a) => a.startsWith('--hours'));
const HOURS = HOURS_ARG ? parseInt(process.argv[process.argv.indexOf(HOURS_ARG) + 1], 10) : 24;
const since = new Date(Date.now() - HOURS * 3_600_000).toISOString();

async function main() {
  const [findings, gaps, sources, accepted] = await Promise.all([
    supabase
      .from('data_agent_findings')
      .select('id, topic, candidate_url, candidate_title, summary, relevance_score, rationale, status, created_at, gap:data_gap_questions(question)')
      .gt('created_at', since)
      .eq('status', 'pending')
      .order('relevance_score', { ascending: false }),
    supabase
      .from('data_gap_questions')
      .select('id, question, topic, status, priority, owner, raised_at')
      .gt('raised_at', since)
      .order('priority'),
    supabase
      .from('data_sources_inventory')
      .select('source_key, display_name, last_refreshed_at, row_count')
      .gt('updated_at', since)
      .order('last_refreshed_at', { ascending: false }),
    supabase
      .from('data_agent_findings')
      .select('candidate_title, candidate_url, resulting_source_key, reviewed_at')
      .gt('reviewed_at', since)
      .eq('status', 'accepted'),
  ]);

  // Classifier progress
  const [{ count: clsTotal }, { count: clsDone }, { count: yjRel }] = await Promise.all([
    supabase.from('foundation_grantees').select('id', { count: 'exact', head: true }),
    supabase.from('foundation_grantees').select('id', { count: 'exact', head: true }).not('yj_classified_at', 'is', null),
    supabase.from('foundation_grantees').select('id', { count: 'exact', head: true }).eq('yj_relevant', true),
  ]);

  const out = [];
  const today = new Date().toISOString().slice(0, 10);
  out.push(`# Data sufficiency digest — ${today}`);
  out.push('');
  out.push(`Window: last ${HOURS} hours.`);
  out.push('');

  // Headline
  out.push('## Headline');
  out.push('');
  out.push(`- **${findings.data?.length || 0} new agent findings** awaiting review`);
  out.push(`- **${gaps.data?.length || 0} new gap questions** raised`);
  out.push(`- **${sources.data?.length || 0} sources** refreshed`);
  out.push(`- **${accepted.data?.length || 0} findings accepted** into inventory`);
  out.push(`- YJ classifier coverage: **${clsDone}/${clsTotal} (${Math.round((clsDone / clsTotal) * 100)}%)**, ${yjRel} flagged YJ-relevant`);
  out.push('');

  // Pending findings (highest-relevance first)
  if (findings.data && findings.data.length > 0) {
    out.push('## New findings — review queue');
    out.push('');
    out.push('Sorted by relevance score (highest first). Review at `/admin/data-sufficiency/findings`.');
    out.push('');
    for (const f of findings.data.slice(0, 30)) {
      const score = Math.round(Number(f.relevance_score) * 100);
      out.push(`### ${score}% · ${f.candidate_title || 'Untitled'}`);
      out.push('');
      out.push(`- **Topic**: ${f.topic}`);
      if (f.gap?.question) out.push(`- **For gap**: ${f.gap.question}`);
      out.push(`- **URL**: ${f.candidate_url}`);
      if (f.summary) out.push(`- **Summary**: ${f.summary}`);
      if (f.rationale) out.push(`- **Why this fits**: ${f.rationale}`);
      out.push('');
    }
  }

  // New gap questions (especially auto-filed by agents)
  if (gaps.data && gaps.data.length > 0) {
    out.push('## New gap questions');
    out.push('');
    const autoFiled = gaps.data.filter((g) => g.owner?.startsWith('agent:'));
    const manual = gaps.data.filter((g) => !g.owner?.startsWith('agent:'));
    if (autoFiled.length > 0) {
      out.push('### Auto-filed by watchers');
      out.push('');
      for (const g of autoFiled) {
        out.push(`- **[P${g.priority} · ${g.topic}]** ${g.question} _(${g.owner})_`);
      }
      out.push('');
    }
    if (manual.length > 0) {
      out.push('### Added manually');
      out.push('');
      for (const g of manual) {
        out.push(`- **[P${g.priority} · ${g.topic}]** ${g.question}`);
      }
      out.push('');
    }
  }

  // Accepted findings (just landed sources)
  if (accepted.data && accepted.data.length > 0) {
    out.push('## Accepted into inventory');
    out.push('');
    for (const a of accepted.data) {
      out.push(`- ${a.candidate_title || 'untitled'} → \`${a.resulting_source_key || '(no key)'}\``);
      out.push(`  ${a.candidate_url}`);
    }
    out.push('');
  }

  // Refreshes
  if (sources.data && sources.data.length > 0) {
    out.push('## Sources refreshed');
    out.push('');
    for (const s of sources.data.slice(0, 30)) {
      out.push(`- \`${s.source_key}\` · ${s.display_name} · ${s.row_count?.toLocaleString() || '—'} rows`);
    }
    out.push('');
  }

  const path = `thoughts/shared/data-sufficiency-digest-${today}.md`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, out.join('\n'));
  console.log(`Wrote ${path}`);
  console.log(`Findings: ${findings.data?.length || 0} · Gaps: ${gaps.data?.length || 0} · Sources: ${sources.data?.length || 0}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
