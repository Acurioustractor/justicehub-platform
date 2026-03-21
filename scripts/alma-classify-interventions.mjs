#!/usr/bin/env node
/**
 * ALMA Intervention Classifier
 *
 * LLM pass on all visible interventions to:
 * 1. Classify as real_program vs scraper_artifact
 * 2. Fix names that look like page titles
 * 3. Flag junk entries as ai_generated
 *
 * Usage:
 *   node scripts/alma-classify-interventions.mjs              # dry-run
 *   node scripts/alma-classify-interventions.mjs --apply       # write to DB
 *   node scripts/alma-classify-interventions.mjs --apply --batch 50
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
        const val = l.slice(eq + 1).trim();
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const batchSize = parseInt(args.find((_, i) => args[i - 1] === '--batch') || '50');

// ─── LLM caller (direct OpenAI-compatible API) ──────────────────────────────

const PROVIDERS = [
  { name: 'groq', key: env.GROQ_API_KEY, url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile' },
  { name: 'gemini', key: env.GEMINI_API_KEY, url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', model: 'gemini-2.5-flash' },
  { name: 'openai', key: env.OPENAI_API_KEY, url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
];

async function callLLM(prompt, { maxTokens = 2000 } = {}) {
  for (const provider of PROVIDERS) {
    if (!provider.key) continue;
    try {
      const res = await fetch(provider.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.key}` },
        body: JSON.stringify({
          model: provider.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.1,
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      // Strip <think> blocks from reasoning models
      return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    } catch {
      continue;
    }
  }
  throw new Error('All LLM providers failed');
}

function extractJSON(text) {
  // Try direct parse
  try { return JSON.parse(text); } catch {}
  // Try extracting from markdown code block
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) try { return JSON.parse(match[1]); } catch {}
  // Try finding JSON object/array
  const jsonMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (jsonMatch) try { return JSON.parse(jsonMatch[1]); } catch {}
  return null;
}

// ─── Classification ──────────────────────────────────────────────────────────

function looksLikeJunk(name) {
  if (!name) return true;
  // URL as name
  if (name.startsWith('http://') || name.startsWith('https://')) return true;
  // HTML fragments
  if (name.includes('<') || name.includes('\\n\\t')) return true;
  // Page titles with site separators
  if (name.includes(' | ') || name.includes(' - ') || name.includes(' :: ')) {
    // Allow "Program Name - Organisation" style
    const parts = name.split(/\s*[|\-:]+\s*/);
    if (parts.some(p => /^(home|homepage|page not found|about|contact|services)$/i.test(p.trim()))) return true;
  }
  // "Page not found" or similar
  if (/^(page not found|404|error|homepage|home$)/i.test(name.trim())) return true;
  return false;
}

async function classifyBatch(interventions) {
  const prompt = `You are a data quality analyst for an Australian youth justice research database called ALMA.

For each entry below, determine:
1. Is this a REAL youth justice program/intervention, or is it JUNK (a scraper artifact, generic page title, government homepage, news article, or unrelated content)?
2. If it's a real program but the name looks like a page title (e.g. "Children, young people and family support | Mission Australia"), extract the REAL program name.

ENTRIES:
${interventions.map((i, idx) => `[${idx + 1}] Name: "${i.name}"
  Type: ${i.type || 'unknown'}
  Org: ${i.operating_organization || 'none'}
  Description (first 200 chars): ${(i.description || '').substring(0, 200)}
  Website: ${i.website || 'none'}`).join('\n\n')}

For EACH entry return:
- idx: entry number
- verdict: "real" or "junk"
- reason: one short sentence explaining why
- fixed_name: if verdict is "real" and name needs fixing, the corrected program name (null otherwise)

Return JSON: { "results": [...] }
Only mark as "junk" if you are confident it is NOT a real youth justice program. When in doubt, mark as "real".`;

  const raw = await callLLM(prompt, { maxTokens: 3000 });
  return extractJSON(raw);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('ALMA Intervention Classifier');
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Batch size: ${batchSize}\n`);

  // Get all visible interventions
  const allInterventions = [];
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data } = await supabase
      .from('alma_interventions')
      .select('id, name, type, operating_organization, description, website, data_provenance, verification_status')
      .neq('verification_status', 'ai_generated')
      .range(from, from + PAGE - 1);
    if (!data?.length) break;
    allInterventions.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  console.log(`Loaded ${allInterventions.length} visible interventions\n`);

  // Quick pre-filter: obvious junk by pattern matching
  const obviousJunk = allInterventions.filter(i => looksLikeJunk(i.name));
  const needsLLM = allInterventions.filter(i => !looksLikeJunk(i.name));

  console.log(`Pattern-detected junk: ${obviousJunk.length}`);
  console.log(`Sending to LLM for classification: ${Math.min(needsLLM.length, batchSize)}\n`);

  // Phase 1: Handle obvious junk
  const results = {
    pattern_junk: obviousJunk.length,
    llm_junk: 0,
    names_fixed: 0,
    real_confirmed: 0,
    errors: [],
  };

  if (apply && obviousJunk.length > 0) {
    console.log('--- Pattern-detected junk (first 20) ---');
    for (const i of obviousJunk.slice(0, 20)) {
      console.log(`  ✗ "${i.name.substring(0, 60)}"`);
    }
    if (obviousJunk.length > 20) console.log(`  ... and ${obviousJunk.length - 20} more\n`);

    // Flag as ai_generated in batches
    const ids = obviousJunk.map(i => i.id);
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      const { error } = await supabase
        .from('alma_interventions')
        .update({ verification_status: 'ai_generated', data_provenance: 'scraper_artifact' })
        .in('id', batch);
      if (error) results.errors.push(`Pattern junk batch ${i}: ${error.message}`);
    }
    console.log(`Flagged ${obviousJunk.length} pattern-detected junk entries\n`);
  } else if (obviousJunk.length > 0) {
    console.log('--- Pattern-detected junk (first 20) ---');
    for (const i of obviousJunk.slice(0, 20)) {
      console.log(`  ✗ "${i.name.substring(0, 60)}"`);
    }
    if (obviousJunk.length > 20) console.log(`  ... and ${obviousJunk.length - 20} more`);
    console.log();
  }

  // Phase 2: LLM classification for ambiguous entries
  const toLLM = needsLLM.slice(0, batchSize);
  const CHUNK_SIZE = 15; // process 15 at a time to stay within token limits

  for (let i = 0; i < toLLM.length; i += CHUNK_SIZE) {
    const chunk = toLLM.slice(i, i + CHUNK_SIZE);
    process.stdout.write(`\rLLM classifying... ${i + chunk.length}/${toLLM.length}`);

    try {
      const parsed = await classifyBatch(chunk);
      if (!parsed?.results) {
        results.errors.push(`Chunk ${i}: no results parsed`);
        continue;
      }

      for (const r of parsed.results) {
        const intervention = chunk[r.idx - 1];
        if (!intervention) continue;

        if (r.verdict === 'junk') {
          results.llm_junk++;
          console.log(`\n  ✗ JUNK: "${intervention.name.substring(0, 50)}" — ${r.reason}`);
          if (apply) {
            await supabase
              .from('alma_interventions')
              .update({ verification_status: 'ai_generated', data_provenance: 'scraper_artifact' })
              .eq('id', intervention.id);
          }
        } else {
          results.real_confirmed++;
          if (r.fixed_name && r.fixed_name !== intervention.name) {
            results.names_fixed++;
            console.log(`\n  ✎ RENAME: "${intervention.name.substring(0, 40)}" → "${r.fixed_name}"`);
            if (apply) {
              await supabase
                .from('alma_interventions')
                .update({ name: r.fixed_name })
                .eq('id', intervention.id);
            }
          }
        }
      }
    } catch (err) {
      results.errors.push(`Chunk ${i}: ${err.message}`);
    }
  }

  console.log('\n\n--- Results ---');
  console.log(`Pattern junk flagged: ${results.pattern_junk}`);
  console.log(`LLM junk flagged: ${results.llm_junk}`);
  console.log(`Names fixed: ${results.names_fixed}`);
  console.log(`Real confirmed: ${results.real_confirmed}`);
  if (results.errors.length) console.log(`Errors: ${results.errors.length}`);

  if (!apply) {
    console.log(`\nDry run. Use --apply to write changes.`);
  }

  // Show final counts
  const { count: visible } = await supabase
    .from('alma_interventions')
    .select('*', { count: 'exact', head: true })
    .neq('verification_status', 'ai_generated');
  const { count: hidden } = await supabase
    .from('alma_interventions')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'ai_generated');

  console.log(`\nFinal: ${visible} visible, ${hidden} hidden (ai_generated)`);
}

main().catch(console.error);
