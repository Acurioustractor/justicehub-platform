#!/usr/bin/env node
/**
 * QFCC Crossover Cohort PDF Data Extractor
 *
 * Downloads the QLD Family & Child Commission crossover PDF
 * and extracts key statistics using Jina Reader.
 *
 * Usage:
 *   node scripts/scrape-qfcc-crossover.mjs              # dry-run
 *   node scripts/scrape-qfcc-crossover.mjs --apply       # write to DB
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ─── Env ───────────────────────────────────────────────────────────────────────

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    try {
      const envFile = readFileSync(envPath, 'utf8');
      envFile
        .split('\n')
        .filter((l) => l && !l.startsWith('#') && l.includes('='))
        .forEach((l) => {
          const eqIdx = l.indexOf('=');
          const key = l.slice(0, eqIdx).trim();
          const val = l.slice(eqIdx + 1).trim();
          if (!env[key]) env[key] = val;
        });
    } catch {}
  }
  return env;
}

const env = loadEnv();
for (const [key, val] of Object.entries(env)) {
  if (!process.env[key]) process.env[key] = val;
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ─── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const applyMode = args.includes('--apply');

console.log(`\n=== QFCC Crossover Cohort PDF Extractor ===`);
console.log(`Mode: ${applyMode ? 'APPLY' : 'DRY-RUN'}\n`);

// ─── PDF Sources ───────────────────────────────────────────────────────────────

const PDF_SOURCES = [
  {
    name: 'QFCC Crossover Cohort Data Insights 2024',
    url: 'https://www.qfcc.qld.gov.au/sites/default/files/2024-11/Crossover%20Cohort%20-%20Data%20Insights.pdf',
    type: 'data',
  },
  {
    name: 'QFCC Crossover Cohort Literature Review 2024',
    url: 'https://www.qfcc.qld.gov.au/sites/default/files/2024-11/Crossover%20Cohort%20-%20Literature%20Review.pdf',
    type: 'literature',
  },
];

// ─── Jina Reader ───────────────────────────────────────────────────────────────

async function fetchPdfText(pdfUrl, name) {
  const jinaUrl = `https://r.jina.ai/${pdfUrl}`;
  console.log(`[fetch] Downloading via Jina Reader: ${name}`);
  console.log(`[fetch] URL: ${jinaUrl}`);

  try {
    const res = await fetch(jinaUrl, {
      headers: {
        Accept: 'text/plain',
        'User-Agent': 'JusticeHub/1.0 (research)',
      },
    });

    if (!res.ok) {
      console.error(`[fetch] HTTP ${res.status}: ${res.statusText}`);
      return null;
    }

    const text = await res.text();
    console.log(`[fetch] Got ${text.length} chars from ${name}`);

    // Save raw text for debugging
    const debugPath = join(root, '.claude', 'cache', `qfcc-${name.includes('Literature') ? 'literature' : 'data'}.txt`);
    writeFileSync(debugPath, text, 'utf8');
    console.log(`[fetch] Saved raw text to ${debugPath}`);

    return text;
  } catch (err) {
    console.error(`[fetch] Failed: ${err.message}`);
    return null;
  }
}

// ─── Text Parsing ──────────────────────────────────────────────────────────────

function extractStats(text, source) {
  const stats = [];
  const sourceName = source.name;
  const sourceUrl = source.url;

  // Helper to push a stat
  function addStat(metric, value, unit, opts = {}) {
    stats.push({
      domain: 'child_protection',
      metric,
      value: typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value,
      unit: unit || null,
      state: opts.state || 'QLD',
      indigenous_status: opts.indigenous_status || null,
      age_group: opts.age_group || null,
      gender: opts.gender || null,
      financial_year: opts.financial_year || '2022-23',
      source_name: sourceName,
      source_url: sourceUrl,
      notes: opts.notes || null,
    });
  }

  // ─── Curated key statistics (hardcoded from known QFCC report structure) ───
  // These are the headline numbers from the report. We extract them with
  // targeted patterns rather than generic regex to ensure accuracy.

  // Helper: search for a number near specific context words
  function findNumber(pattern) {
    const m = text.match(pattern);
    return m ? parseFloat(m[1].replace(/,/g, '')) : null;
  }

  // --- National overview ---
  const totalYjNational = findNumber(/(\d[\d,]+)\s+young people who\s+\n?\s*were under youth justice supervision/i);
  if (totalYjNational) {
    addStat('yj_supervised_total', totalYjNational, 'count', {
      state: 'National',
      notes: 'Total young people under youth justice supervision 2022-23',
    });
  }

  // 65.4% had prior child protection interaction (national)
  const priorCpNational = findNumber(/(\d+\.?\d*)\s*%\s*\(n=[\d,]+\)\s+had prior interaction with/i);
  if (priorCpNational) {
    addStat('yj_prior_cp_interaction_pct', priorCpNational, 'percent', {
      state: 'National',
      notes: 'Pct of YJ supervised youth with prior child protection interaction (national)',
    });
  }

  // --- QLD headline numbers ---
  // QLD total under YJ supervision
  const qldYjTotal = findNumber(/Queensland,?\s+(\d[\d,]+)\s+children were under\s+\n?\s*youth justice supervision/i);
  if (qldYjTotal) {
    addStat('yj_supervised_total', qldYjTotal, 'count', {
      notes: 'QLD children under youth justice supervision 2022-23',
    });
  }

  // QLD highest number with CP interaction: 1,863
  const qldCpCount = findNumber(/highest\s+\n?\s*number\s+\(n=\s*(\d[\d,]+)\s*\)/i);
  if (qldCpCount) {
    addStat('yj_prior_cp_interaction_count', qldCpCount, 'count', {
      notes: 'QLD children under YJ supervision with prior CP system contact (highest nationally)',
    });
  }

  // QLD proportion with CP interaction: 72.9%
  const qldCpPct = findNumber(/second highest proportion\s+\((\d+\.?\d*)%\)/i);
  if (qldCpPct) {
    addStat('yj_prior_cp_interaction_pct', qldCpPct, 'percent', {
      notes: 'QLD pct of YJ supervised youth with prior CP interaction (2nd highest nationally)',
    });
  }

  // --- Indigenous overrepresentation ---
  // 81.2% First Nations YJ with CP interaction
  const fnCpPct = findNumber(/(\d+\.?\d*)\s*%\s+of First Nations young people under youth justice supervision had child protection/i);
  if (fnCpPct) {
    addStat('yj_prior_cp_interaction_pct', fnCpPct, 'percent', {
      indigenous_status: 'Indigenous',
      notes: 'QLD First Nations YJ youth with CP interactions in last 10 years',
    });
  }

  // 61.3% non-Indigenous YJ with CP interaction
  const nonFnCpPct = findNumber(/(\d+\.?\d*)\s*%\s+of non\s*-?\s*Indigenous young people/i);
  if (nonFnCpPct) {
    addStat('yj_prior_cp_interaction_pct', nonFnCpPct, 'percent', {
      indigenous_status: 'Non-Indigenous',
      notes: 'QLD non-Indigenous YJ youth with CP interactions in last 10 years',
    });
  }

  // 539 First Nations children aged 10-13
  const fn1013 = findNumber(/First\s+[Nn]ations children aged 10\s*-?\s*13\s*\(n=(\d+)\)/i);
  if (fn1013) {
    addStat('yj_prior_cp_first_nations_count', fn1013, 'count', {
      indigenous_status: 'Indigenous',
      age_group: '10-13',
      notes: 'QLD First Nations children 10-13 under YJ with prior CP contact',
    });
  }

  // 498 non-Indigenous 10-13 nationally
  const nonFn1013 = findNumber(/non\s*-?\s*\n?\s*Indigenous 10\s*-?\s*13 year olds\s+\(n=(\d+)\)/i);
  if (nonFn1013) {
    addStat('yj_prior_cp_non_indigenous_count', nonFn1013, 'count', {
      state: 'National',
      indigenous_status: 'Non-Indigenous',
      age_group: '10-13',
      notes: 'National non-Indigenous children 10-13 under YJ with prior CP contact (QLD First Nations alone exceeds this)',
    });
  }

  // --- Gender x Indigenous crossover rates ---
  // 89.6% First Nations females
  const fnFemalePct = findNumber(/(\d+\.?\d*)\s*%\s+of\s+\n?\s*First Nations females/i);
  if (fnFemalePct) {
    addStat('yj_prior_cp_interaction_pct', fnFemalePct, 'percent', {
      indigenous_status: 'Indigenous',
      gender: 'Female',
      notes: 'QLD First Nations females under YJ with prior CP contact',
    });
  }

  // 78.1% First Nations males
  const fnMalePct = findNumber(/(\d+\.?\d*)\s*%\s+of First Nations males/i);
  if (fnMalePct) {
    addStat('yj_prior_cp_interaction_pct', fnMalePct, 'percent', {
      indigenous_status: 'Indigenous',
      gender: 'Male',
      notes: 'QLD First Nations males under YJ with prior CP contact',
    });
  }

  // 75.3% non-Indigenous females
  const nonFnFemalePct = findNumber(/(\d+\.?\d*)\s*%\s+of non\s*-?\s*Indigenous females/i);
  if (nonFnFemalePct) {
    addStat('yj_prior_cp_interaction_pct', nonFnFemalePct, 'percent', {
      indigenous_status: 'Non-Indigenous',
      gender: 'Female',
      notes: 'QLD non-Indigenous females under YJ with prior CP contact',
    });
  }

  // 57.9% non-Indigenous males
  const nonFnMalePct = findNumber(/(\d+\.?\d*)\s*%\s+of non\s*-?\s*Indigenous males/i);
  if (nonFnMalePct) {
    addStat('yj_prior_cp_interaction_pct', nonFnMalePct, 'percent', {
      indigenous_status: 'Non-Indigenous',
      gender: 'Male',
      notes: 'QLD non-Indigenous males under YJ with prior CP contact',
    });
  }

  // --- Substantiation rates ---
  // 45% community-based supervision had substantiated notifications
  const commSubstPct = findNumber(/(\d+)\s*%\s+of young people under\s+\n?\s*community\s*-?\s*based supervision/i);
  if (commSubstPct) {
    addStat('yj_substantiated_notification_pct', commSubstPct, 'percent', {
      state: 'National',
      notes: 'Pct of YJ community-based supervision youth with substantiated abuse notification',
    });
  }

  // 50% detention had substantiated notifications
  const detSubstPct = findNumber(/(\d+)\s*%\s+of those in detention/i);
  if (detSubstPct) {
    addStat('yj_substantiated_notification_pct_detention', detSubstPct, 'percent', {
      state: 'National',
      notes: 'Pct of YJ detained youth with substantiated abuse notification',
    });
  }

  // --- Age at first supervision ---
  // 94% of children aged 10
  const age10Pct = findNumber(/(\d+)\s*%\s+of children aged 10\s+(?:years?\s+)?(?:at\s+\n?\s*)?(?:thei?r\s+)?first youth justice/i);
  if (age10Pct) {
    addStat('yj_prior_cp_by_age_at_first_supervision', age10Pct, 'percent', {
      state: 'National',
      age_group: '10',
      notes: 'Pct of children aged 10 at first YJ supervision with prior CP interaction (national)',
    });
  }

  // 37% of young people 18+
  const age18Pct = findNumber(/(\d+)\s*%\s+of young people 18 and over/i);
  if (age18Pct) {
    addStat('yj_prior_cp_by_age_at_first_supervision', age18Pct, 'percent', {
      state: 'National',
      age_group: '18+',
      notes: 'Pct of young people 18+ at first YJ supervision with prior CP interaction (national)',
    });
  }

  // --- QLD 10-13 year olds ---
  // 686 QLD children aged 10-13
  const qld1013 = findNumber(/(\d+)\s+Queensland children aged 10\s*-?\s*\n?\s*13/i);
  if (!qld1013) {
    // Try alternate pattern
    const alt = findNumber(/(\d+)\s+children aged 10\s*-?\s*\n?\s*13\s+under youth justice/i);
    if (alt) {
      addStat('yj_supervised_count', alt, 'count', {
        age_group: '10-13',
        notes: 'QLD children aged 10-13 under YJ supervision with prior CP interactions',
      });
    }
  } else {
    addStat('yj_supervised_count', qld1013, 'count', {
      age_group: '10-13',
      notes: 'QLD children aged 10-13 under YJ supervision with prior CP interactions',
    });
  }

  // 78.6% of 10-13 were First Nations
  const fn1013Pct = findNumber(/(\d+\.?\d*)\s*%\s*\)\s*\n?\s*were First Nations/i);
  if (fn1013Pct) {
    addStat('yj_first_nations_pct', fn1013Pct, 'percent', {
      indigenous_status: 'Indigenous',
      age_group: '10-13',
      notes: 'QLD pct of 10-13 under YJ who were First Nations',
    });
  }

  // --- Level of CP involvement ---
  // 1,718 investigated notification (67.2%)
  const investNotif = findNumber(/(\d[\d,]+)\s+were subject to an\s+\n?\s*investigated notification/i);
  if (investNotif) {
    addStat('yj_investigated_notification_count', investNotif, 'count', {
      notes: 'QLD YJ children subject to investigated notification in past 10 years',
    });
  }
  const investNotifPct = findNumber(/investigated notification[^.]*?\((\d+\.?\d*)%\)/i);
  if (investNotifPct) {
    addStat('yj_investigated_notification_pct', investNotifPct, 'percent', {
      notes: 'QLD pct of YJ children subject to investigated notification',
    });
  }

  // 724 care and protection order (28.3%)
  const careOrder = findNumber(/(\d+)\s+were subject to a care and\s+\n?\s*protection order/i);
  if (careOrder) {
    addStat('yj_care_protection_order_count', careOrder, 'count', {
      notes: 'QLD YJ children subject to care and protection order in past 10 years',
    });
  }
  const careOrderPct = findNumber(/care and\s+\n?\s*protection order[^.]*?\((\d+\.?\d*)%\)/i);
  if (careOrderPct) {
    addStat('yj_care_protection_order_pct', careOrderPct, 'percent', {
      notes: 'QLD pct of YJ children with care and protection order',
    });
  }

  // 721 out-of-home care (28.2%)
  const oohcCount = findNumber(/(\d+)\s+had experience of out\s*-?\s*of\s*-?\s*home\s+\n?\s*care/i);
  if (oohcCount) {
    addStat('yj_oohc_count', oohcCount, 'count', {
      notes: 'QLD YJ children with out-of-home care experience in past 10 years',
    });
  }
  const oohcPct = findNumber(/out\s*-?\s*of\s*-?\s*home\s+\n?\s*care[^.]*?\((\d+\.?\d*)%\)/i);
  if (oohcPct) {
    addStat('yj_oohc_pct', oohcPct, 'percent', {
      notes: 'QLD pct of YJ children with out-of-home care experience',
    });
  }

  // --- OOHC: national total 2,306 (25.4%) ---
  const oohcNational = findNumber(/total of (\d[\d,]+) children\s+\n?\s*\((\d+\.?\d*)%\)\s+under youth justice/i);
  // Try a simpler pattern
  const oohcNatCount = findNumber(/total of (\d[\d,]+) children/i);
  if (oohcNatCount) {
    addStat('yj_oohc_count', oohcNatCount, 'count', {
      state: 'National',
      notes: 'National YJ children who experienced out-of-home care in prior 10 years',
    });
  }
  const oohcNatPct = findNumber(/total of \d[\d,]+ children\s+\n?\s*\((\d+\.?\d*)%\)/i);
  if (oohcNatPct) {
    addStat('yj_oohc_pct', oohcNatPct, 'percent', {
      state: 'National',
      notes: 'National pct of YJ children who experienced out-of-home care',
    });
  }

  // 489 First Nations in OOHC (67.85%)
  const fnOohcCount = findNumber(/(\d+)\s+of the\s+\n?\s*total \((\d+\.?\d*)%\) being First Nations/i);
  // Simple patterns
  const fnOohc = findNumber(/with (\d+) of the/i);
  if (fnOohc) {
    addStat('yj_oohc_first_nations_count', fnOohc, 'count', {
      indigenous_status: 'Indigenous',
      notes: 'QLD First Nations children in OOHC who were under YJ supervision',
    });
  }
  const fnOohcPct2 = findNumber(/(\d+\.?\d*)\s*%\s*\)\s+being First Nations/i);
  if (fnOohcPct2) {
    addStat('yj_oohc_first_nations_pct', fnOohcPct2, 'percent', {
      indigenous_status: 'Indigenous',
      notes: 'QLD pct of YJ OOHC children who were First Nations',
    });
  }

  // Foster/kin care: 6.9% vs any OOHC 28.3%
  const fosterPct = findNumber(/foster\/kin care\s+\n?\s*\((\d+\.?\d*)%\)/i);
  if (fosterPct) {
    addStat('yj_detention_foster_kin_only_pct', fosterPct, 'percent', {
      notes: 'Pct of detained children who had only been in foster/kin care (vs any OOHC)',
    });
  }

  // --- Investigated notifications national ---
  // 62.1% (n=5,633) subject to investigated notification
  const investNatPct = findNumber(/(\d+\.?\d*)\s*%\s+\n?\s*\(n=[\d,]+\)\s+were the subject of an\s+\n?\s*investigated notification/i);
  if (investNatPct) {
    addStat('yj_investigated_notification_pct', investNatPct, 'percent', {
      state: 'National',
      notes: 'National pct of YJ youth subject to investigated notification',
    });
  }
  const investNatCount = findNumber(/\(n=(\d[\d,]+)\)\s+were the subject of an\s+\n?\s*investigated notification/i);
  if (investNatCount) {
    addStat('yj_investigated_notification_count', investNatCount, 'count', {
      state: 'National',
      notes: 'National count of YJ youth subject to investigated notification',
    });
  }

  // --- Fallback: generic percentage patterns for anything we missed ---
  const genericPctPattern = /(\d+\.?\d*)\s*%\s+([^.\n]{5,80})/g;
  let gm;
  const existingValues = new Set(stats.map((s) => `${s.value}_${s.unit}`));
  while ((gm = genericPctPattern.exec(text)) !== null) {
    const pct = parseFloat(gm[1]);
    const context = gm[2].trim().replace(/\s+/g, ' ').slice(0, 100);
    // Skip if we already captured this value
    if (existingValues.has(`${pct}_percent`)) continue;
    if (pct > 0 && pct <= 100 && !/source|table|sum|equal/i.test(context)) {
      existingValues.add(`${pct}_percent`);
      const isIndigenous = /aboriginal|torres strait|indigenous|first nations/i.test(context);
      addStat(
        `crossover_generic_pct`,
        pct,
        'percent',
        {
          indigenous_status: isIndigenous ? 'Indigenous' : null,
          notes: `${pct}% ${context}`.slice(0, 200),
        }
      );
    }
  }

  return stats;
}

// ─── Deduplication ─────────────────────────────────────────────────────────────

function dedup(stats) {
  const seen = new Set();
  return stats.filter((s) => {
    const key = `${s.metric}|${s.value}|${s.state}|${s.indigenous_status}|${s.age_group}|${s.gender}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── DB Insert ─────────────────────────────────────────────────────────────────

async function insertStats(stats) {
  if (stats.length === 0) {
    console.log('[insert] No stats to insert.');
    return { inserted: 0, errors: 0 };
  }

  let inserted = 0;
  let errors = 0;

  const chunkSize = 50;
  for (let i = 0; i < stats.length; i += chunkSize) {
    const chunk = stats.slice(i, i + chunkSize);

    if (!applyMode) {
      console.log(`[insert] DRY-RUN: would insert ${chunk.length} rows (batch ${Math.floor(i / chunkSize) + 1})`);
      inserted += chunk.length;
      continue;
    }

    const { data, error } = await supabase.from('cross_system_stats').insert(chunk).select('id');

    if (error) {
      console.error(`[insert] Error on batch ${Math.floor(i / chunkSize) + 1}: ${error.message}`);
      for (const row of chunk) {
        const { error: rowErr } = await supabase.from('cross_system_stats').insert(row);
        if (rowErr) {
          console.error(`[insert]   Failed: ${row.metric} -- ${rowErr.message}`);
          errors++;
        } else {
          inserted++;
        }
      }
    } else {
      inserted += (data || chunk).length;
    }
  }

  return { inserted, errors };
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Verify table exists
  console.log('[check] Verifying cross_system_stats table exists...');
  const { count, error: countErr } = await supabase
    .from('cross_system_stats')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.error(`[check] Table error: ${countErr.message}`);
    console.log('[check] Run scrape-aihw-crossover.mjs --apply --migrate first to create the table.');
    process.exit(1);
  }
  console.log(`[check] Table has ${count} existing rows.\n`);

  let allStats = [];

  for (const source of PDF_SOURCES) {
    console.log(`\n--- Processing: ${source.name} ---`);
    const text = await fetchPdfText(source.url, source.name);
    if (!text) {
      console.log(`[skip] Could not fetch ${source.name}`);
      continue;
    }

    // Show text preview
    const preview = text.slice(0, 500).replace(/\n/g, ' ').trim();
    console.log(`[preview] ${preview}...`);

    const stats = extractStats(text, source);
    console.log(`[parse] Extracted ${stats.length} raw statistics from ${source.name}`);

    allStats.push(...stats);
  }

  // Dedup
  allStats = dedup(allStats);
  console.log(`\n[total] ${allStats.length} unique statistics after deduplication`);

  // Print all found stats
  if (allStats.length > 0) {
    console.log('\n--- Found Statistics ---');
    for (const s of allStats) {
      const parts = [
        `  ${s.metric}`,
        `= ${s.value} ${s.unit || ''}`.trim(),
      ];
      if (s.indigenous_status) parts.push(`[${s.indigenous_status}]`);
      if (s.age_group) parts.push(`[age ${s.age_group}]`);
      if (s.gender) parts.push(`[${s.gender}]`);
      if (s.financial_year) parts.push(`(${s.financial_year})`);
      console.log(parts.join(' '));
    }
    console.log('');
  }

  // Check for existing QFCC data
  const { data: existing } = await supabase
    .from('cross_system_stats')
    .select('id')
    .like('source_name', 'QFCC%');

  if (existing && existing.length > 0) {
    console.log(`[warn] Found ${existing.length} existing QFCC rows. New rows will be added (not deduplicated against DB).`);
    if (applyMode) {
      console.log('[warn] Consider deleting existing QFCC rows first if re-running.');
    }
  }

  // Insert
  const result = await insertStats(allStats);
  console.log(`\n[done] Inserted: ${result.inserted}, Errors: ${result.errors}`);

  if (!applyMode && allStats.length > 0) {
    console.log('\nRe-run with --apply to write to database.');
  }
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
