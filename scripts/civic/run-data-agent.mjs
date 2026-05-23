#!/usr/bin/env node
/**
 * Standalone runner for the data-sufficiency research agent.
 * Mirrors src/app/api/cron/data-sufficiency/agent/route.ts.
 *
 * Usage:
 *   node scripts/civic/run-data-agent.mjs --batch 10
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const SERPER_KEY = process.env.SERPER_API_KEY;
if (!GEMINI_KEY) { console.error('GEMINI_API_KEY required'); process.exit(1); }
if (!SERPER_KEY) { console.error('SERPER_API_KEY required'); process.exit(1); }

const BATCH_ARG = process.argv.find((a) => a.startsWith('--batch'));
const BATCH = BATCH_ARG ? parseInt(process.argv[process.argv.indexOf(BATCH_ARG) + 1], 10) : 10;

async function serperSearch(q, limit = 6) {
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': SERPER_KEY },
      body: JSON.stringify({ q, num: limit, gl: 'au' }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.organic || []).slice(0, limit).map((r) => ({
      url: r.link, title: r.title, snippet: r.snippet,
    }));
  } catch { return []; }
}

async function rankCandidates(question, topic, candidates) {
  if (candidates.length === 0) return [];
  const userPrompt = `Data gap question: "${question}"
Topic: ${topic}

For each candidate URL, judge whether it's a credible source that could close the data gap.
Score 0-1 (1 = closes the gap perfectly). Output JSON array, one object per candidate, in the same order:
{ "url": string, "title": string, "relevance": number, "summary": string (one-sentence what's there), "rationale": string (why this fits / doesn't fit the gap) }

Candidates:
${candidates.map((c, i) => `${i + 1}. ${c.title || 'untitled'} — ${c.url}\n   ${c.snippet || ''}`).join('\n\n')}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p?.url && typeof p.relevance === 'number')
      .map((p) => ({
        url: p.url,
        title: p.title || candidates.find((c) => c.url === p.url)?.title || '',
        relevance: p.relevance,
        summary: p.summary || '',
        rationale: p.rationale || '',
      }));
  } catch { return []; }
}

function buildQuery(question, hintUrl) {
  let q = question;
  if (hintUrl) {
    try {
      const u = new URL(hintUrl);
      q = `${q} site:${u.hostname.replace(/^www\./, '')} OR ${q}`;
    } catch {}
  }
  return `${q} youth justice Australia dataset OR register OR report`;
}

async function main() {
  const { data: all } = await supabase
    .from('data_gap_questions')
    .select('id, question, topic, proposed_source_url, priority, status, raised_at')
    .in('status', ['open', 'investigating'])
    .order('priority')
    .order('raised_at', { ascending: true });

  // Topic-rotate
  const byTopic = new Map();
  for (const g of all || []) {
    if (!byTopic.has(g.topic)) byTopic.set(g.topic, []);
    byTopic.get(g.topic).push(g);
  }
  const topics = [...byTopic.keys()];
  const gaps = [];
  while (gaps.length < BATCH) {
    let added = 0;
    for (const t of topics) {
      if (gaps.length >= BATCH) break;
      const next = byTopic.get(t).shift();
      if (next) { gaps.push(next); added++; }
    }
    if (added === 0) break;
  }

  if (gaps.length === 0) {
    console.log('No open gap questions.');
    return;
  }
  console.log(`Processing ${gaps.length} gaps across ${topics.length} topics`);

  let totalFindings = 0;
  for (const gap of gaps) {
    const searchQ = buildQuery(gap.question, gap.proposed_source_url);
    process.stdout.write(`  [${gap.topic}] ${gap.question.slice(0, 70)}... `);
    const candidates = await serperSearch(searchQ, 6);
    if (candidates.length === 0) { console.log('no candidates'); continue; }
    const ranked = await rankCandidates(gap.question, gap.topic, candidates);
    const findings = ranked.filter((r) => r.relevance >= 0.4);
    let inserted = 0;
    for (const f of findings) {
      const { error } = await supabase
        .from('data_agent_findings')
        .upsert({
          gap_question_id: gap.id,
          topic: gap.topic,
          candidate_url: f.url,
          candidate_title: f.title,
          summary: f.summary,
          relevance_score: f.relevance,
          rationale: f.rationale,
          search_query: searchQ,
          raw_result: candidates.find((c) => c.url === f.url) || null,
        }, { onConflict: 'gap_question_id,candidate_url', ignoreDuplicates: true });
      if (!error) { inserted++; totalFindings++; }
    }
    console.log(`${candidates.length} candidates → ${findings.length} relevant (${inserted} new)`);
    if (findings.some((f) => f.relevance >= 0.7) && gap.status === 'open') {
      await supabase.from('data_gap_questions').update({ status: 'investigating' }).eq('id', gap.id);
    }
  }

  console.log(`\nDone. ${totalFindings} new findings inserted.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
