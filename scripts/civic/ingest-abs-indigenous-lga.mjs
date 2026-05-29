#!/usr/bin/env node
/**
 * ABS Indigenous LGA population ingestion via the ABS DataAPI (SDMX-JSON).
 *
 * Pipeline:
 *   1. GET https://api.data.abs.gov.au/dataflow/ABS — full dataflow catalog.
 *   2. Filter for Indigenous + LGA themes (keys: indigenous, aboriginal,
 *      atsi, C21 census, ERP). Print the matches in dry-run so the operator
 *      can verify before --apply.
 *   3. For each verified dataflow, GET
 *      https://api.data.abs.gov.au/data/{dataflow}/all?startPeriod=2021&format=jsondata
 *   4. Dump SDMX-JSON to abs_raw_responses (raw-first pattern, lets us
 *      refine extraction later without re-hitting ABS).
 *   5. Transform SDMX-JSON dimensions × observation array into tidy rows
 *      keyed on (lga_code, reference_year, source, age_group, sex,
 *      indigenous_status).
 *   6. Upsert tidy rows into abs_indigenous_population_by_lga.
 *
 * Schema lives in supabase/migrations/20260523_abs_indigenous_lga.sql.
 *
 * Usage:
 *   node scripts/civic/ingest-abs-indigenous-lga.mjs               # dry-run
 *   node scripts/civic/ingest-abs-indigenous-lga.mjs --apply       # write
 *   node scripts/civic/ingest-abs-indigenous-lga.mjs --dataflow X  # restrict to one id
 *   node scripts/civic/ingest-abs-indigenous-lga.mjs --limit 25    # cap rows on first dataflow
 *
 * Fallback: if ABS DataAPI is unreachable, dump the URL + error and exit
 * cleanly (exit 0). Never fabricate dataflow IDs.
 *
 * See: docs/civic-connectors/build-specs.md §6.B
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const argValue = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
};
const dataflowFilter = argValue('--dataflow');
const rowLimit = parseInt(argValue('--limit') || '10', 10);

// ABS DataAPI base. Section 6.B specifies these endpoints.
const ABS_DATAFLOW_URL = 'https://api.data.abs.gov.au/dataflow/ABS';
const ABS_DATA_BASE = 'https://api.data.abs.gov.au/data';

// Match terms across dataflow id + name + description. Case-insensitive.
const MATCH_TERMS = [
  'indigenous',
  'aboriginal',
  'atsi',
  'torres strait',
  'c21',
  'census 2021',
  'erp',
  'estimated resident',
];

// IDs frequently surface as upper-snake; we additionally short-circuit on
// substring "IND" in the id when LGA cardinality is present.
const ID_HINTS = ['IND', 'ABORIG', 'C21'];

async function fetchJson(url) {
  // SDMX-JSON requires explicit Accept negotiation.
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.sdmx.data+json;version=1.0.0, application/json',
      'User-Agent': 'JusticeHub-ABS-Ingest/1.0',
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} :: ${text.slice(0, 200)}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('json')) {
    const text = await res.text();
    throw new Error(`non-JSON response (${ct}) :: ${text.slice(0, 200)}`);
  }
  return res.json();
}

function extractDataflows(catalog) {
  // ABS catalog shape varies between SDMX-JSON v1 and v2. Try common paths
  // before falling back to the references{} map.
  if (catalog?.data?.dataflows) return catalog.data.dataflows;
  if (catalog?.dataflows) return catalog.dataflows;
  if (catalog?.Dataflow) return catalog.Dataflow;
  if (catalog?.structures?.dataflows) return catalog.structures.dataflows;

  // ABS DataAPI actual shape (verified 2026-05-23): { resources: [], references: {} }
  // where references is keyed by URN like
  //   "urn:sdmx:org.sdmx.infomodel.datastructure.Dataflow=ABS:ABORIGINAL_ID_POP_PROJ(1.0)"
  // and entries have { id, name, agencyID, version, urn, ... }.
  // We identify Dataflow entries by URN substring rather than a class field.
  if (catalog?.references && typeof catalog.references === 'object') {
    return Object.entries(catalog.references)
      .filter(([urn, _r]) => /Dataflow=/i.test(urn))
      .map(([_urn, r]) => r)
      .filter((r) => r && r.id);
  }
  return [];
}

function dataflowMatchesIndigenousLGA(df) {
  const id = String(df.id || df.ID || '').trim();
  const name = String(
    typeof df.name === 'string' ? df.name : df.name?.en || df.Name || ''
  );
  const desc = String(
    typeof df.description === 'string'
      ? df.description
      : df.description?.en || df.Description || ''
  );
  const haystack = `${id} ${name} ${desc}`.toLowerCase();
  const termHit = MATCH_TERMS.some((t) => haystack.includes(t));
  const idHit = ID_HINTS.some((h) => id.toUpperCase().includes(h));
  // Cheap LGA hint — id often encodes geography. We don't insist on it
  // because the dataflow catalog frequently omits geography from the id.
  return termHit || idHit;
}

function dimensionIndex(structure) {
  // SDMX-JSON dimension order is positional. Two sub-lists matter:
  //   - series dimensions (key prefix on each series)
  //   - observation dimensions (key suffix per observation row, usually TIME)
  // We return both so the parser can resolve series keys + observation keys
  // separately.
  const buildList = (dims) =>
    (dims || []).map((d) => ({
      id: (d.id || d.ID || '').toUpperCase(),
      values: (d.values || []).map((v) => ({
        id: v.id ?? v.ID ?? null,
        name:
          typeof v.name === 'string' ? v.name : v.name?.en || v.Name || null,
      })),
    }));
  const series = buildList(structure?.dimensions?.series);
  const observation = buildList(structure?.dimensions?.observation);
  // Fallback for flat dimension lists (older responses).
  const flat = buildList(Array.isArray(structure?.dimensions) ? structure.dimensions : null);
  return { series, observation, flat };
}

function safeLookup(dimList, dimName, keyParts) {
  if (!dimList || dimList.length === 0) return null;
  // Try common dimension id variants. ABS uses LGA / LGA_YYYY / REGION /
  // REF_AREA depending on the dataflow vintage. The LGA lookup also accepts
  // any `LGA_YYYY` pattern via regex fallback because ABS re-issues the
  // ASGS code list every year (LGA_2016 ... LGA_2024 all seen 2026-05-23).
  const exactCandidates = {
    LGA: ['LGA', 'LGA_2021', 'REGION', 'REF_AREA', 'GEOGRAPHY', 'ASGS_2011', 'ASGS_2016', 'ASGS_2021'],
    YEAR: ['TIME_PERIOD', 'TIME', 'PERIOD'],
    AGE: ['AGE', 'AGE_GROUP', 'AGEGROUP'],
    SEX: ['SEX', 'SEX_ABS'],
    INDIG: ['INDIGENOUS_STATUS', 'INDIG_STATUS', 'INDIGENOUS', 'IND_STATUS', 'INDP'],
    STATE: ['STATE', 'STE', 'STATE_CODE'],
  }[dimName] || [dimName];

  const regexFallback = {
    LGA: /^(LGA|ASGS)_?\d{0,4}$/i,
    YEAR: null,
    AGE: null,
    SEX: null,
    INDIG: /^INDIG/i,
    STATE: /^(STATE|STE)/i,
  }[dimName];

  const tryIdx = (idx) => {
    if (idx < 0) return null;
    const valIdx = parseInt(keyParts[idx], 10);
    if (Number.isFinite(valIdx) && dimList[idx].values[valIdx]) {
      return dimList[idx].values[valIdx];
    }
    return null;
  };

  for (const candidate of exactCandidates) {
    const hit = tryIdx(dimList.findIndex((d) => d.id === candidate));
    if (hit) return hit;
  }
  if (regexFallback) {
    const hit = tryIdx(dimList.findIndex((d) => regexFallback.test(d.id)));
    if (hit) return hit;
  }
  return null;
}

function parseSdmxJson(json, dataflowId) {
  // ABS DataAPI returns SDMX-JSON v1+ with two possible shapes per dataset:
  //   (a) flat observations:  dataSet.observations = { "k1:k2:k3:t" -> [value, ...] }
  //   (b) series + obs:       dataSet.series = { "k1:k2:k3" -> { observations: { "t" -> [value] } } }
  // The series form is what ABS uses for ERP/Census LGA flows. Both share the
  // same structures[0].dimensions split (series vs observation).
  const root = json?.data || json;
  const dataSets = root?.dataSets || [];
  const structure =
    (Array.isArray(root?.structures) ? root.structures[0] : null) ||
    root?.structure ||
    null;
  if (!structure || dataSets.length === 0) return [];
  const { series: seriesDims, observation: obsDims, flat } = dimensionIndex(structure);

  // Combined dimension list for flat-observation keys: series + observation.
  const flatDims = [...seriesDims, ...obsDims];
  const useDims = flatDims.length > 0 ? flatDims : flat;

  const rows = [];

  const sourceLabel = (() => {
    const up = dataflowId.toUpperCase();
    if (up.includes('C21') || up.includes('CENSUS2021')) return 'census_2021';
    if (up.includes('C16') || up.includes('CENSUS2016')) return 'census_2016';
    if (up.includes('PROJ')) return 'erp_projection';
    if (up.includes('ERP')) return 'erp_annual';
    return 'abs_dataflow';
  })();

  const numericCount = (v) => {
    const raw = Array.isArray(v) ? v[0] : v;
    if (typeof raw === 'number' && Number.isFinite(raw)) return Math.round(raw);
    if (raw == null) return null;
    const f = parseFloat(raw);
    return Number.isFinite(f) ? Math.round(f) : null;
  };

  const emit = (allKeyParts, value) => {
    const lga = safeLookup(useDims, 'LGA', allKeyParts);
    const year = safeLookup(useDims, 'YEAR', allKeyParts);
    const age = safeLookup(useDims, 'AGE', allKeyParts);
    const sex = safeLookup(useDims, 'SEX', allKeyParts);
    const indig = safeLookup(useDims, 'INDIG', allKeyParts);
    const state = safeLookup(useDims, 'STATE', allKeyParts);
    if (!lga?.id) return; // require an LGA-like code
    rows.push({
      lga_code: String(lga.id),
      lga_name: lga.name || null,
      state: state?.name || state?.id || null,
      reference_year: parseInt(year?.id || year?.name || '0', 10) || null,
      source: sourceLabel,
      age_group: age?.id || age?.name || 'all',
      sex: sex?.id || sex?.name || 'all',
      indigenous_status: indig?.id || indig?.name || 'unknown',
      count_persons: numericCount(value),
      dataflow_id: dataflowId,
    });
  };

  for (const ds of dataSets) {
    // Shape (a): flat observations on the dataset.
    if (ds.observations && Object.keys(ds.observations).length > 0) {
      for (const [k, v] of Object.entries(ds.observations)) {
        emit(k.split(':'), v);
      }
      continue;
    }
    // Shape (b): series-keyed, each with nested observations.
    if (ds.series && typeof ds.series === 'object') {
      for (const [sKey, sObj] of Object.entries(ds.series)) {
        const sParts = sKey.split(':');
        const obs = sObj?.observations || {};
        for (const [oKey, v] of Object.entries(obs)) {
          const oParts = oKey.split(':');
          emit([...sParts, ...oParts], v);
        }
      }
    }
  }
  return rows;
}

async function storeRawResponse(dataflowId, queryKey, queryUrl, json) {
  if (!apply) return { action: 'would_store_raw' };
  const { error } = await supabase.from('abs_raw_responses').upsert(
    {
      dataflow_id: dataflowId,
      query_key: queryKey,
      query_url: queryUrl,
      response_jsonb: json,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: 'dataflow_id,query_key' }
  );
  if (error) {
    if (
      /relation .* does not exist/i.test(error.message) ||
      /could not find the table/i.test(error.message) ||
      error.code === 'PGRST205'
    ) {
      return { action: 'raw_table_missing' };
    }
    throw new Error(`abs_raw_responses upsert: ${error.message}`);
  }
  return { action: 'stored_raw' };
}

async function upsertTidyRows(rows) {
  if (!apply) return { action: 'would_upsert', count: rows.length };
  if (rows.length === 0) return { action: 'noop', count: 0 };
  // Upsert in batches of 500 — SDMX responses can be tens of thousands of rows.
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const slice = rows.slice(i, i + 500);
    const { error } = await supabase
      .from('abs_indigenous_population_by_lga')
      .upsert(slice, {
        onConflict:
          'lga_code,reference_year,source,age_group,sex,indigenous_status',
      });
    if (error) {
      if (
        /relation .* does not exist/i.test(error.message) ||
        /could not find the table/i.test(error.message) ||
        error.code === 'PGRST205'
      ) {
        return { action: 'tidy_table_missing', count: inserted };
      }
      throw new Error(`tidy upsert: ${error.message}`);
    }
    inserted += slice.length;
  }
  return { action: 'upserted', count: inserted };
}

async function main() {
  console.log(`ABS Indigenous LGA ingest · ${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Dataflow catalog: ${ABS_DATAFLOW_URL}\n`);

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('! Supabase env not set — running fetch-only mode (no writes possible).');
  }

  let catalog;
  try {
    catalog = await fetchJson(ABS_DATAFLOW_URL);
  } catch (e) {
    // Fallback per spec: dump URL + error, exit cleanly. Never fabricate IDs.
    console.warn(`! ABS dataflow catalog fetch failed: ${e.message}`);
    console.warn(`  URL attempted: ${ABS_DATAFLOW_URL}`);
    console.warn(`  (exiting cleanly — retry next cycle)`);
    process.exit(0);
  }

  const allFlows = extractDataflows(catalog);
  console.log(`Catalog returned ${allFlows.length} dataflows total.\n`);
  if (allFlows.length === 0) {
    console.warn('! No dataflows extracted — catalog shape may have changed.');
    console.warn('  Top-level keys observed:', Object.keys(catalog).slice(0, 10).join(', '));
    process.exit(0);
  }

  const matches = allFlows.filter(dataflowMatchesIndigenousLGA);
  console.log(`Indigenous/LGA matches: ${matches.length}\n`);

  matches.slice(0, 30).forEach((df) => {
    const id = df.id || df.ID;
    const name =
      typeof df.name === 'string' ? df.name : df.name?.en || df.Name || '';
    console.log(`  ${String(id).padEnd(36)} ${name}`);
  });
  if (matches.length > 30) console.log(`  ... +${matches.length - 30} more`);
  console.log('');

  if (matches.length < 5) {
    console.warn(`! Fewer than 5 matches (${matches.length}) — catalog may have shifted.`);
    console.warn('  Adjust MATCH_TERMS / ID_HINTS in the script if you can see the right ids in the dump.');
  }

  // Pick the first dataflow to attempt a parse — operator can scope via
  // --dataflow if they want a specific id.
  const target = dataflowFilter
    ? matches.find((m) => (m.id || m.ID) === dataflowFilter) ||
      allFlows.find((m) => (m.id || m.ID) === dataflowFilter)
    : matches[0];

  if (!target) {
    console.warn('! No target dataflow to probe — stopping here.');
    process.exit(0);
  }

  const targetId = target.id || target.ID;
  const queryKey = 'all';
  const dataUrl = `${ABS_DATA_BASE}/${encodeURIComponent(targetId)}/${queryKey}?startPeriod=2021&format=jsondata`;
  console.log(`Probing first dataflow: ${targetId}`);
  console.log(`  URL: ${dataUrl}\n`);

  let dataJson;
  try {
    dataJson = await fetchJson(dataUrl);
  } catch (e) {
    console.warn(`! Data fetch for ${targetId} failed: ${e.message}`);
    console.warn('  (raw-first pattern: nothing stored, exit clean)');
    process.exit(0);
  }

  // Raw store FIRST, transformation SECOND. Lets us re-transform later
  // without re-hitting ABS.
  const rawRes = await storeRawResponse(targetId, queryKey, dataUrl, dataJson);
  console.log(`  raw response: ${rawRes.action}`);

  let tidyRows = [];
  try {
    tidyRows = parseSdmxJson(dataJson, targetId);
  } catch (e) {
    console.warn(`  ! parse error (raw still stored if applied): ${e.message}`);
  }
  console.log(`  tidy rows parsed: ${tidyRows.length}`);

  if (tidyRows.length > 0) {
    const preview = tidyRows.slice(0, rowLimit);
    console.log(`\n  preview (first ${preview.length}):`);
    preview.forEach((r) => {
      console.log(
        `    ${r.lga_code} ${String(r.lga_name || '').slice(0, 24).padEnd(24)} ${r.reference_year}  ${r.indigenous_status.padEnd(14)} ${r.count_persons ?? '-'}`
      );
    });
  }

  if (apply) {
    const up = await upsertTidyRows(tidyRows);
    console.log(`\n  tidy upsert: ${up.action} (${up.count})`);
  } else {
    console.log(`\n  dry-run: would upsert ${tidyRows.length} tidy rows + 1 raw response.`);
    console.log(`  rerun with --apply to persist.`);
  }
}

main().catch((e) => {
  console.error(`fatal: ${e.message}`);
  process.exit(1);
});
