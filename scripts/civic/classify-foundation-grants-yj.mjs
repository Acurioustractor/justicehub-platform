#!/usr/bin/env node
/**
 * YJ-relevance classifier for foundation_grantees grants.
 * Idempotent - skips rows with yj_classified_at IS NOT NULL.
 *
 * Usage:
 *   node scripts/civic/classify-foundation-grants-yj.mjs              # dry-run, 50 rows
 *   node scripts/civic/classify-foundation-grants-yj.mjs --apply --yes-production
 *   node scripts/civic/classify-foundation-grants-yj.mjs --apply --yes-production --batch 500
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config({ path: '.env.local', quiet: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const APPLY = process.argv.includes('--apply');
const YES_PRODUCTION = process.argv.includes('--yes-production');
const DEBUG = process.argv.includes('--debug');
const args = process.argv.slice(2);

if (APPLY && !YES_PRODUCTION) {
  console.error('Refusing production write without --yes-production.');
  process.exit(1);
}

function option(name) {
  const eq = args.find((a) => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const idx = args.indexOf(name);
  if (idx >= 0) return args[idx + 1];
  return null;
}

const BATCH = option('--batch') ? parseInt(option('--batch'), 10) : (APPLY ? 200 : 50);
const FOUNDATION_ID = option('--foundation-id');
const FOUNDATION_ABN = option('--foundation-abn');
const EXTRACTION_METHODS = option('--extraction-method')
  ? option('--extraction-method').split(',').map((s) => s.trim()).filter(Boolean)
  : [];
const SOURCE_KEY = option('--source-key');
const SHOW_SAMPLES = option('--samples') ? parseInt(option('--samples'), 10) : 10;

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
- If the only evidence is a generic partner-list commitment, classify as not_yj unless the grantee name or program text explicitly signals justice, legal service, youth justice, detention, diversion, bail, reinvestment, courts, sentencing, policing of children, or criminal justice reform.
- Do not use broad reputation or outside knowledge to infer youth justice relevance. Base the classification on the supplied grantee, program, and evidence text.

Output JSON only:
{
  "yj_relevant": boolean,
  "yj_category": "<one of the 6 categories>",
  "yj_confidence": number 0..1,
  "yj_evidence_snippet": "<1 sentence quoting source text that drove the classification, max 200 chars>"
}`;

// Mirrors FoundationGrantYjClassificationSchema in src/lib/ai/llm-schemas.ts.
// This standalone .mjs script cannot import the TS module without a tsx loader.
const ClassificationSchema = z.object({
  yj_relevant: z.boolean(),
  yj_category: z.enum([
    'direct_yj_service',
    'yj_research',
    'yj_advocacy',
    'broader_justice_includes_yj',
    'indigenous_youth_general',
    'not_yj',
  ]),
  yj_confidence: z.coerce.number().min(0).max(1),
  yj_evidence_snippet: z
    .string()
    .min(5)
    .transform((s) => s.slice(0, 300))
    .default('No clear youth justice evidence in grant input.'),
});

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
  const filters = [
    FOUNDATION_ID ? `foundation-id=${FOUNDATION_ID}` : null,
    FOUNDATION_ABN ? `foundation-abn=${FOUNDATION_ABN}` : null,
    EXTRACTION_METHODS.length ? `extraction-method=${EXTRACTION_METHODS.join(',')}` : null,
    SOURCE_KEY ? `source-key=${SOURCE_KEY}` : null,
  ].filter(Boolean);
  console.log(`Foundation grant YJ classifier - ${APPLY ? 'APPLY' : 'DRY-RUN'} - batch=${BATCH}${filters.length ? ` - ${filters.join(' - ')}` : ''}\n`);

  let query = supabase
    .from('foundation_grantees')
    .select('id, foundation_id, foundation_abn, foundation_name, grantee_name, program_name, grant_year, evidence_text, extraction_method, metadata')
    .is('yj_classified_at', null)
    .limit(BATCH);

  if (FOUNDATION_ID) query = query.eq('foundation_id', FOUNDATION_ID);
  if (FOUNDATION_ABN) query = query.eq('foundation_abn', FOUNDATION_ABN);
  if (EXTRACTION_METHODS.length === 1) query = query.eq('extraction_method', EXTRACTION_METHODS[0]);
  if (EXTRACTION_METHODS.length > 1) query = query.in('extraction_method', EXTRACTION_METHODS);
  if (SOURCE_KEY) query = query.filter('metadata->>source_key', 'eq', SOURCE_KEY);

  const { data: rows, error } = await query;
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
  const samples = [];

  for (const r of rows) {
    processed++;
    try {
      const raw = await callGemini(buildInput(r));
      const parsed = ClassificationSchema.safeParse(raw);
      if (!parsed.success) {
        if (DEBUG) {
          console.warn(`  invalid classification for ${r.grantee_name}: ${parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`);
        }
        errors++;
        continue;
      }
      const result = parsed.data;
      const isYj = result.yj_relevant === true && result.yj_category !== 'not_yj';
      if (isYj) yjCount++;
      byCategory[result.yj_category] = (byCategory[result.yj_category] || 0) + 1;
      if (samples.length < SHOW_SAMPLES) {
        samples.push({
          grantee_name: r.grantee_name,
          program_name: r.program_name,
          category: result.yj_category,
          relevant: isYj,
          confidence: result.yj_confidence,
          snippet: result.yj_evidence_snippet,
        });
      }
      if (processed % 20 === 0) {
        console.log(`  ${processed}/${rows.length} - ${yjCount} YJ-relevant so far`);
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

  console.log(`\nProcessed ${processed} - YJ-relevant ${yjCount} - errors ${errors}`);
  console.log('Category distribution:');
  for (const [cat, n] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n} ${cat}`);
  }
  if (samples.length > 0) {
    console.log('\nSamples:');
    for (const s of samples) {
      console.log(`  - ${s.grantee_name}: ${s.category} (${s.confidence})${s.program_name ? ` - ${s.program_name}` : ''}`);
      console.log(`    ${s.snippet.slice(0, 180)}`);
    }
  }
  if (!APPLY) console.log('\nDry-run - pass --apply to write.');
}

main().catch((e) => { console.error(e); process.exit(1); });
