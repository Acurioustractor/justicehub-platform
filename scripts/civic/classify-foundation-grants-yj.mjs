#!/usr/bin/env node
/**
 * YJ-relevance classifier for foundation_grantees grants.
 * Idempotent — skips rows with yj_classified_at IS NOT NULL.
 *
 * Usage:
 *   node scripts/civic/classify-foundation-grants-yj.mjs              # dry-run, 50 rows
 *   node scripts/civic/classify-foundation-grants-yj.mjs --apply
 *   node scripts/civic/classify-foundation-grants-yj.mjs --apply --batch 500
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const APPLY = process.argv.includes('--apply');
const BATCH_ARG = process.argv.find((a) => a.startsWith('--batch'));
const BATCH = BATCH_ARG ? parseInt(process.argv[process.argv.indexOf(BATCH_ARG) + 1], 10) : (APPLY ? 200 : 50);

const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  console.error('GEMINI_API_KEY required');
  process.exit(1);
}

const SYSTEM_PROMPT = `You classify Australian foundation grants by their relevance to youth justice (YJ).

Categories (pick exactly one):
- direct_yj_service: grant funds a frontline YJ service (diversion, bail support, on-Country mentoring, post-release, family conferencing, youth legal first-response).
- yj_research: grant funds research or evaluation of YJ programs or systems.
- yj_advocacy: grant funds advocacy / policy reform on YJ (e.g. raise the age, custody reform).
- broader_justice_includes_yj: grant funds a broader justice or legal service that includes YJ as part of scope.
- indigenous_youth_general: grant funds Indigenous youth wellbeing more broadly (cultural, education, sport, mentoring) without explicit YJ framing.
- not_yj: grant has no clear YJ connection.

Rules:
- Aboriginal Legal Service without YJ specifics = broader_justice_includes_yj.
- A cultural / on-Country / mentoring grant for Indigenous youth = indigenous_youth_general (NOT direct_yj_service unless the grant text mentions diversion / justice / detention / bail).
- Children's services / kids programs without justice framing = not_yj.
- Health, housing, disability without justice framing = not_yj.

Output JSON only:
{
  "yj_relevant": boolean,
  "yj_category": "<one of the 6 categories>",
  "yj_confidence": number 0..1,
  "yj_evidence_snippet": "<1 sentence quoting source text that drove the classification, max 200 chars>"
}`;

async function callGemini(input) {
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GEMINI_KEY}` },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: input },
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) return null;
  try { return JSON.parse(text); } catch {
    const m = text.match(/\{[\s\S]+\}/);
    return m ? JSON.parse(m[0]) : null;
  }
}

function buildInput(row) {
  const parts = [
    `Foundation: ${row.foundation_name || 'unknown'}`,
    `Grantee: ${row.grantee_name || 'unknown'}`,
    row.program_name ? `Program: ${row.program_name}` : null,
    row.grant_year ? `Year: ${row.grant_year}` : null,
    row.evidence_text ? `Evidence: ${row.evidence_text.slice(0, 1000)}` : null,
  ].filter(Boolean);
  return parts.join('\n');
}

async function main() {
  console.log(`Foundation grant YJ classifier · ${APPLY ? 'APPLY' : 'DRY-RUN'} · batch=${BATCH}\n`);

  const { data: rows, error } = await supabase
    .from('foundation_grantees')
    .select('id, foundation_name, grantee_name, program_name, grant_year, evidence_text')
    .is('yj_classified_at', null)
    .limit(BATCH);
  if (error) {
    console.error('Fetch failed:', error.message);
    process.exit(1);
  }
  console.log(`Found ${rows?.length || 0} unclassified grants\n`);
  if (!rows || rows.length === 0) {
    console.log('Nothing to classify.');
    return;
  }

  let processed = 0;
  let yjCount = 0;
  let errors = 0;
  const byCategory = {};

  for (const r of rows) {
    processed++;
    try {
      const result = await callGemini(buildInput(r));
      if (!result || !result.yj_category) { errors++; continue; }
      const isYj = result.yj_relevant === true && result.yj_category !== 'not_yj';
      if (isYj) yjCount++;
      byCategory[result.yj_category] = (byCategory[result.yj_category] || 0) + 1;
      if (processed % 20 === 0) {
        console.log(`  ${processed}/${rows.length} · ${yjCount} YJ-relevant so far`);
      }
      if (!APPLY) continue;
      const { error: updErr } = await supabase
        .from('foundation_grantees')
        .update({
          yj_relevant: isYj,
          yj_category: result.yj_category,
          yj_confidence: result.yj_confidence ?? null,
          yj_evidence_snippet: result.yj_evidence_snippet?.slice(0, 300) ?? null,
          yj_classified_at: new Date().toISOString(),
        })
        .eq('id', r.id);
      if (updErr) errors++;
    } catch {
      errors++;
    }
  }

  console.log(`\nProcessed ${processed} · YJ-relevant ${yjCount} · errors ${errors}`);
  console.log('Category distribution:');
  for (const [cat, n] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n} ${cat}`);
  }
  if (!APPLY) console.log('\nDry-run — pass --apply to write.');
}

main().catch((e) => { console.error(e); process.exit(1); });
