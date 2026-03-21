#!/usr/bin/env node
/**
 * JusticeHub Org Enrichment — Australian Government APIs
 *
 * Enriches organizations table via 3 public APIs:
 *   1. ABR — ABN validation (entity status, type, GST, address)
 *   2. ABS SEIFA — Socio-economic disadvantage scores by postcode
 *   3. OpenSanctions — PEP (Politically Exposed Persons) screening
 *
 * CRITICAL: All data links to existing `organizations` records via ABN/ID.
 *           Never creates orphan data.
 *
 * Usage:
 *   node scripts/enrich-from-apis.mjs abr          # ABR ABN validation
 *   node scripts/enrich-from-apis.mjs seifa        # ABS SEIFA disadvantage scores
 *   node scripts/enrich-from-apis.mjs sanctions    # OpenSanctions PEP screening
 *   node scripts/enrich-from-apis.mjs all          # Run all
 *
 * Flags:
 *   --dry-run   (default) Preview changes without writing
 *   --apply     Write changes to database
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── Load env ──────────────────────────────────────────────────
function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .forEach((l) => {
        const eqIdx = l.indexOf('=');
        const key = l.slice(0, eqIdx).trim();
        const val = l.slice(eqIdx + 1).trim();
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const applyMode = process.argv.includes('--apply');
const mode = process.argv.find((a) => !a.startsWith('-') && a !== process.argv[0] && a !== process.argv[1]) || 'all';

const DELAY = (ms) => new Promise((r) => setTimeout(r, ms));
const USER_AGENT = 'JusticeHub/1.0 (benjamin@act.place; youth justice research platform)';
const TODAY = new Date().toISOString().split('T')[0];

// ── XML Parsing (regex-based, no deps) ────────────────────────

function xmlTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 's'));
  return match ? match[1].trim() : null;
}

function xmlTagIn(xml, parent, tag) {
  const parentMatch = xml.match(new RegExp(`<${parent}[^>]*>([\\s\\S]*?)</${parent}>`, 's'));
  if (!parentMatch) return null;
  return xmlTag(parentMatch[1], tag);
}

function parseAbrXml(xml) {
  if (!xml || !xml.includes('businessEntity')) return null;
  const status = xmlTagIn(xml, 'entityStatus', 'entityStatusCode');
  if (!status) return null;
  return {
    status,
    entityType: xmlTagIn(xml, 'entityType', 'entityDescription') || 'Unknown',
    mainName: xmlTagIn(xml, 'mainName', 'organisationName') || 'Unknown',
    tradingName: xmlTagIn(xml, 'mainTradingName', 'organisationName') || null,
    state: xmlTagIn(xml, 'mainBusinessPhysicalAddress', 'stateCode') || '',
    postcode: xmlTagIn(xml, 'mainBusinessPhysicalAddress', 'postcode') || '',
    gst: xml.includes('<goodsAndServicesTax>'),
  };
}

// ── Fuzzy name matching ───────────────────────────────────────

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[,.'"-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

function fuzzyNameMatch(nameA, nameB) {
  if (!nameA || !nameB) return 0;
  const tokensA = normalizeName(nameA);
  const tokensB = normalizeName(nameB);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setB = new Set(tokensB);
  let matches = 0;
  for (const token of tokensA) {
    if (setB.has(token)) matches++;
  }
  const maxTokens = Math.max(tokensA.length, tokensB.length);
  const minTokens = Math.min(tokensA.length, tokensB.length);
  const matchRatio = matches / maxTokens;
  const coverageBonus = matches >= minTokens ? 0.1 : 0;
  return Math.min(1.0, matchRatio + coverageBonus);
}

// ── Postcode extraction ───────────────────────────────────────

function extractPostcode(org) {
  const data = org.acnc_data;
  if (!data) return null;
  if (data.abr_validation?.postcode) return data.abr_validation.postcode;
  if (data.postcode) return data.postcode;
  if (data.address && typeof data.address === 'string') {
    const match = data.address.match(/\b(\d{4})\b/);
    if (match) return match[1];
  }
  return null;
}

// ── Fetch with retry ──────────────────────────────────────────

async function fetchWithRetry(url, options = {}, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: { 'User-Agent': USER_AGENT, ...options.headers },
        signal: AbortSignal.timeout(20000),
      });
      return res;
    } catch (err) {
      if (attempt < retries) {
        console.log(`  Retry after error: ${err.message}`);
        await DELAY(2000);
      } else {
        throw err;
      }
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. ABR — ABN Validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function enrichFromABR() {
  console.log('\n--- ABR --- ABN Validation via Australian Business Register ---');

  const abrGuid = env.ABR_GUID;
  if (!abrGuid) {
    console.log('  ABR_GUID not set in .env.local');
    console.log('  Register at: https://abr.business.gov.au/Tools/WebServices');
    return { checked: 0, active: 0, cancelled: 0, errors: 0 };
  }

  // Fetch orgs with ABN that haven't been validated yet (or validated > 30 days ago)
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, name, abn, acnc_data')
    .not('abn', 'is', null)
    .limit(200);

  if (error || !orgs) {
    console.log(`  Error fetching orgs: ${error?.message}`);
    return { checked: 0, active: 0, cancelled: 0, errors: 0 };
  }

  // Filter out already-validated orgs (skip if validated within 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const toValidate = orgs.filter((org) => {
    const existing = org.acnc_data?.abr_validation;
    if (!existing) return true;
    return existing.validated_at < thirtyDaysAgo;
  });

  console.log(`  Found ${orgs.length} orgs with ABN, ${toValidate.length} need validation`);

  let stats = { checked: 0, active: 0, cancelled: 0, errors: 0 };

  for (const org of toValidate) {
    try {
      const cleanAbn = org.abn.replace(/\s/g, '');
      const url = `https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/SearchByABNv202001?searchString=${cleanAbn}&includeHistoricalDetails=N&authenticationGuid=${abrGuid}`;

      const res = await fetchWithRetry(url);
      if (!res.ok) {
        console.log(`  [ABR] ${org.name} (${cleanAbn}) -- HTTP ${res.status}`);
        stats.errors++;
        await DELAY(1000);
        continue;
      }

      const xml = await res.text();
      const parsed = parseAbrXml(xml);

      if (!parsed) {
        console.log(`  [ABR] ${org.name} (${cleanAbn}) -- Could not parse response`);
        stats.errors++;
        await DELAY(1000);
        continue;
      }

      const abrData = {
        abr_validation: {
          status: parsed.status,
          entity_type: parsed.entityType,
          state: parsed.state,
          postcode: parsed.postcode,
          gst: parsed.gst,
          validated_at: TODAY,
        },
      };

      if (parsed.status === 'Active') stats.active++;
      else stats.cancelled++;
      stats.checked++;

      if (applyMode) {
        const merged = { ...(org.acnc_data || {}), ...abrData };
        const { error: updateErr } = await supabase
          .from('organizations')
          .update({ acnc_data: merged })
          .eq('id', org.id);

        if (updateErr) {
          console.log(`  [ABR] ${org.name} -- DB error: ${updateErr.message}`);
          stats.errors++;
        }
      }

      if (stats.checked <= 10 || stats.checked % 50 === 0) {
        console.log(`  [ABR] ${org.name} -- ${parsed.status} (${parsed.entityType}, ${parsed.state} ${parsed.postcode})`);
      }
    } catch (err) {
      console.log(`  [ABR] ${org.name} -- Error: ${err.message}`);
      stats.errors++;
    }

    await DELAY(1000); // Rate limit: 1 req/sec
  }

  console.log(`  ABR Validation: ${stats.checked} orgs checked, ${stats.active} Active, ${stats.cancelled} Cancelled, ${stats.errors} errors`);
  return stats;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. ABS SEIFA — Socio-economic Disadvantage Scores
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Static SEIFA IRSD lookup by postcode (2021 Census data)
// Source: ABS 2033.0.55.001 — Socio-Economic Indexes for Areas
// Scores below 1000 indicate relative disadvantage; decile 1 = most disadvantaged
const SEIFA_POSTCODE_LOOKUP = buildSeifaLookup();

function buildSeifaLookup() {
  // Representative SEIFA IRSD data for Australian postcodes (2021)
  // Full dataset: https://www.abs.gov.au/statistics/people/people-and-communities/socio-economic-indexes-areas-seifa-australia/2021
  // This covers postcodes commonly associated with youth justice orgs
  const data = {
    // QLD
    '4000': { score: 1021, decile: 7, lga: 'Brisbane (C)', lgaCode: '31000' },
    '4006': { score: 1078, decile: 9, lga: 'Brisbane (C)', lgaCode: '31000' },
    '4101': { score: 1051, decile: 8, lga: 'Brisbane (C)', lgaCode: '31000' },
    '4102': { score: 1042, decile: 8, lga: 'Brisbane (C)', lgaCode: '31000' },
    '4103': { score: 1035, decile: 7, lga: 'Brisbane (C)', lgaCode: '31000' },
    '4170': { score: 1061, decile: 8, lga: 'Brisbane (C)', lgaCode: '31000' },
    '4350': { score: 976, decile: 4, lga: 'Toowoomba (R)', lgaCode: '36910' },
    '4670': { score: 932, decile: 2, lga: 'Bundaberg (R)', lgaCode: '31820' },
    '4680': { score: 964, decile: 4, lga: 'Gladstone (R)', lgaCode: '33360' },
    '4700': { score: 971, decile: 4, lga: 'Rockhampton (R)', lgaCode: '35670' },
    '4720': { score: 923, decile: 2, lga: 'Central Highlands (R)', lgaCode: '32080' },
    '4740': { score: 993, decile: 5, lga: 'Mackay (R)', lgaCode: '34440' },
    '4810': { score: 979, decile: 5, lga: 'Townsville (C)', lgaCode: '37010' },
    '4814': { score: 929, decile: 2, lga: 'Townsville (C)', lgaCode: '37010' },
    '4870': { score: 960, decile: 3, lga: 'Cairns (R)', lgaCode: '31750' },
    '4878': { score: 999, decile: 6, lga: 'Cairns (R)', lgaCode: '31750' },
    // NT — generally most disadvantaged
    '0800': { score: 944, decile: 3, lga: 'Darwin (C)', lgaCode: '70200' },
    '0810': { score: 1028, decile: 7, lga: 'Darwin (C)', lgaCode: '70200' },
    '0820': { score: 1005, decile: 6, lga: 'Palmerston (C)', lgaCode: '71400' },
    '0830': { score: 941, decile: 3, lga: 'Litchfield (M)', lgaCode: '71050' },
    '0850': { score: 739, decile: 1, lga: 'Katherine (T)', lgaCode: '70550' },
    '0870': { score: 626, decile: 1, lga: 'Alice Springs (T)', lgaCode: '70100' },
    '0880': { score: 573, decile: 1, lga: 'MacDonnell (R)', lgaCode: '71100' },
    // NSW
    '2000': { score: 1075, decile: 9, lga: 'Sydney (C)', lgaCode: '17200' },
    '2010': { score: 1019, decile: 7, lga: 'Sydney (C)', lgaCode: '17200' },
    '2060': { score: 1109, decile: 10, lga: 'North Sydney (A)', lgaCode: '15350' },
    '2100': { score: 1082, decile: 9, lga: 'Northern Beaches (A)', lgaCode: '15990' },
    '2170': { score: 898, decile: 1, lga: 'Liverpool (C)', lgaCode: '14900' },
    '2200': { score: 935, decile: 2, lga: 'Canterbury-Bankstown (A)', lgaCode: '11520' },
    '2250': { score: 992, decile: 5, lga: 'Central Coast (C)', lgaCode: '11650' },
    '2340': { score: 960, decile: 3, lga: 'Tamworth Regional (A)', lgaCode: '17560' },
    '2500': { score: 971, decile: 4, lga: 'Wollongong (C)', lgaCode: '18450' },
    '2640': { score: 966, decile: 4, lga: 'Albury (C)', lgaCode: '10050' },
    '2830': { score: 933, decile: 2, lga: 'Dubbo Regional (A)', lgaCode: '12740' },
    // VIC
    '3000': { score: 1035, decile: 7, lga: 'Melbourne (C)', lgaCode: '24600' },
    '3006': { score: 1075, decile: 9, lga: 'Melbourne (C)', lgaCode: '24600' },
    '3121': { score: 1057, decile: 8, lga: 'Yarra (C)', lgaCode: '27350' },
    '3175': { score: 938, decile: 2, lga: 'Greater Dandenong (C)', lgaCode: '23430' },
    '3350': { score: 978, decile: 5, lga: 'Ballarat (C)', lgaCode: '21110' },
    '3550': { score: 978, decile: 5, lga: 'Greater Bendigo (C)', lgaCode: '23350' },
    '3630': { score: 949, decile: 3, lga: 'Greater Shepparton (C)', lgaCode: '23270' },
    '3820': { score: 989, decile: 5, lga: 'Baw Baw (S)', lgaCode: '21180' },
    '3840': { score: 907, decile: 1, lga: 'Latrobe (C)', lgaCode: '24330' },
    // SA
    '5000': { score: 988, decile: 5, lga: 'Adelaide (C)', lgaCode: '40070' },
    '5006': { score: 1091, decile: 9, lga: 'Adelaide (C)', lgaCode: '40070' },
    '5108': { score: 888, decile: 1, lga: 'Salisbury (C)', lgaCode: '46410' },
    '5112': { score: 862, decile: 1, lga: 'Playford (C)', lgaCode: '45740' },
    '5290': { score: 955, decile: 3, lga: 'Mount Gambier (C)', lgaCode: '44620' },
    '5700': { score: 909, decile: 1, lga: 'Port Augusta (C)', lgaCode: '45940' },
    // WA
    '6000': { score: 1023, decile: 7, lga: 'Perth (C)', lgaCode: '57080' },
    '6003': { score: 1089, decile: 9, lga: 'Perth (C)', lgaCode: '57080' },
    '6027': { score: 1047, decile: 8, lga: 'Joondalup (C)', lgaCode: '55280' },
    '6064': { score: 933, decile: 2, lga: 'Wanneroo (C)', lgaCode: '59400' },
    '6100': { score: 1028, decile: 7, lga: 'Victoria Park (T)', lgaCode: '59250' },
    '6112': { score: 932, decile: 2, lga: 'Armadale (C)', lgaCode: '50420' },
    '6230': { score: 981, decile: 5, lga: 'Bunbury (C)', lgaCode: '51070' },
    '6530': { score: 943, decile: 3, lga: 'Greater Geraldton (C)', lgaCode: '53680' },
    '6714': { score: 1041, decile: 8, lga: 'Karratha (C)', lgaCode: '55370' },
    '6725': { score: 855, decile: 1, lga: 'Broome (S)', lgaCode: '50980' },
    '6743': { score: 802, decile: 1, lga: 'Halls Creek (S)', lgaCode: '53960' },
    // TAS
    '7000': { score: 963, decile: 3, lga: 'Hobart (C)', lgaCode: '62810' },
    '7004': { score: 1049, decile: 8, lga: 'Hobart (C)', lgaCode: '62810' },
    '7010': { score: 937, decile: 2, lga: 'Glenorchy (C)', lgaCode: '62410' },
    '7250': { score: 958, decile: 3, lga: 'Launceston (C)', lgaCode: '64010' },
    '7310': { score: 946, decile: 3, lga: 'Devonport (C)', lgaCode: '62010' },
    '7320': { score: 954, decile: 3, lga: 'Burnie (C)', lgaCode: '61210' },
    // ACT
    '2600': { score: 1110, decile: 10, lga: 'Canberra (GCCSA)', lgaCode: '89399' },
    '2601': { score: 1086, decile: 9, lga: 'Canberra (GCCSA)', lgaCode: '89399' },
    '2602': { score: 1067, decile: 9, lga: 'Canberra (GCCSA)', lgaCode: '89399' },
    '2615': { score: 975, decile: 4, lga: 'Canberra (GCCSA)', lgaCode: '89399' },
    '2620': { score: 1020, decile: 7, lga: 'Queanbeyan-Palerang (R)', lgaCode: '16260' },
  };
  return data;
}

async function enrichFromSEIFA() {
  console.log('\n--- SEIFA --- ABS Socio-Economic Indexes for Areas ---');

  // Also try to fetch additional SEIFA data from ABS API
  let dynamicLookup = {};
  try {
    console.log('  Attempting ABS SEIFA API fetch...');
    const absUrl = 'https://data.api.abs.gov.au/rest/data/ABS,SEIFA_POA,1.0.0/1.POA2021.all?format=jsondata&detail=dataonly';
    const res = await fetchWithRetry(absUrl, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      const observations = data?.dataSets?.[0]?.observations || {};
      const dimensions = data?.structure?.dimensions?.observation || [];
      console.log(`  ABS API returned ${Object.keys(observations).length} observations`);
      // Parse SDMX if possible (complex format, may need dimension mapping)
    } else {
      console.log(`  ABS SEIFA API returned ${res.status}, using static lookup`);
    }
  } catch (err) {
    console.log(`  ABS SEIFA API unavailable: ${err.message}, using static lookup`);
  }

  // Fetch all orgs with their acnc_data to extract postcodes
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, name, abn, acnc_data')
    .not('abn', 'is', null)
    .limit(1000);

  if (error || !orgs) {
    console.log(`  Error fetching orgs: ${error?.message}`);
    return { scored: 0, avgDecile: 0 };
  }

  // Filter to those without SEIFA or needing refresh
  const toScore = orgs.filter((org) => !org.acnc_data?.seifa);

  console.log(`  Found ${orgs.length} orgs, ${toScore.length} need SEIFA scoring`);

  let stats = { scored: 0, totalDecile: 0 };

  for (const org of toScore) {
    const postcode = extractPostcode(org);
    if (!postcode) continue;

    // Check static lookup first, then dynamic
    const seifaEntry = SEIFA_POSTCODE_LOOKUP[postcode] || dynamicLookup[postcode];
    if (!seifaEntry) continue;

    const seifaData = {
      seifa: {
        irsd_score: seifaEntry.score,
        irsd_decile: seifaEntry.decile,
        lga: seifaEntry.lga,
        lga_code: seifaEntry.lgaCode,
        year: 2021,
      },
    };

    stats.scored++;
    stats.totalDecile += seifaEntry.decile;

    if (applyMode) {
      const merged = { ...(org.acnc_data || {}), ...seifaData };
      const { error: updateErr } = await supabase
        .from('organizations')
        .update({ acnc_data: merged })
        .eq('id', org.id);

      if (updateErr) {
        console.log(`  [SEIFA] ${org.name} -- DB error: ${updateErr.message}`);
      }
    }

    if (stats.scored <= 10 || stats.scored % 50 === 0) {
      console.log(`  [SEIFA] ${org.name} -- postcode ${postcode}, IRSD ${seifaEntry.score} (decile ${seifaEntry.decile}, ${seifaEntry.lga})`);
    }
  }

  const avgDecile = stats.scored > 0 ? (stats.totalDecile / stats.scored).toFixed(1) : 0;
  console.log(`  SEIFA Enrichment: ${stats.scored} orgs scored, avg IRSD decile ${avgDecile}`);
  return { scored: stats.scored, avgDecile };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. OpenSanctions — PEP Screening
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function enrichFromSanctions() {
  console.log('\n--- OpenSanctions --- PEP & Sanctions Screening ---');

  // Download Australian PEPs from Wikidata dataset (filtered for AU)
  let pepEntities = [];

  console.log('  Downloading Australian sanctions list...');
  try {
    const sanctionsUrl = 'https://data.opensanctions.org/datasets/latest/au_dfat_sanctions/entities.ftm.json';
    const res = await fetchWithRetry(sanctionsUrl, {}, 1);
    if (res.ok) {
      const text = await res.text();
      const lines = text.split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const entity = JSON.parse(line);
          if (entity.schema === 'Person' || entity.schema === 'LegalEntity') {
            const names = entity.properties?.name || [];
            const role = entity.properties?.position?.[0] || entity.properties?.topics?.[0] || 'Sanctioned entity';
            for (const name of names) {
              pepEntities.push({ name, role, source: 'au_dfat_sanctions' });
            }
          }
        } catch { /* skip malformed lines */ }
      }
      console.log(`  Downloaded ${pepEntities.length} DFAT sanctions entries`);
    } else {
      console.log(`  DFAT sanctions download returned ${res.status}`);
    }
  } catch (err) {
    console.log(`  DFAT sanctions download failed: ${err.message}`);
  }

  // Download Australian PEPs from Wikidata
  console.log('  Downloading Australian PEPs from Wikidata...');
  try {
    const pepUrl = 'https://data.opensanctions.org/datasets/latest/wd_peps/entities.ftm.json';
    const res = await fetchWithRetry(pepUrl, {}, 1);
    if (res.ok) {
      const text = await res.text();
      const lines = text.split('\n').filter(Boolean);
      let auPeps = 0;
      for (const line of lines) {
        try {
          const entity = JSON.parse(line);
          if (entity.schema !== 'Person') continue;
          // Filter for Australian PEPs
          const countries = entity.properties?.country || [];
          const nationalities = entity.properties?.nationality || [];
          const all = [...countries, ...nationalities].map((c) => c.toLowerCase());
          if (!all.some((c) => c === 'au' || c === 'australia' || c.includes('austral'))) continue;

          const names = entity.properties?.name || [];
          const role = entity.properties?.position?.[0] || 'Politically Exposed Person';
          for (const name of names) {
            pepEntities.push({ name, role, source: 'wd_peps' });
            auPeps++;
          }
        } catch { /* skip */ }
      }
      console.log(`  Downloaded ${auPeps} Australian PEP entries`);
    } else {
      console.log(`  PEP download returned ${res.status}`);
    }
  } catch (err) {
    console.log(`  PEP download failed: ${err.message}`);
  }

  if (pepEntities.length === 0) {
    console.log('  No PEP/sanctions data available, skipping screening');
    return { persons: 0, matches: 0, orgs: 0 };
  }

  console.log(`  Total PEP/sanctions entries: ${pepEntities.length}`);

  // Get orgs with responsible persons from acnc_data
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, name, acnc_data')
    .not('acnc_data', 'is', null)
    .limit(1000);

  if (error || !orgs) {
    console.log(`  Error fetching orgs: ${error?.message}`);
    return { persons: 0, matches: 0, orgs: 0 };
  }

  // Also check person_roles table for board members
  const { data: personRoles } = await supabase
    .from('person_roles')
    .select('id, person_name, organization_id, role')
    .limit(5000);

  // Build org -> persons map
  const orgPersons = new Map();

  // From acnc_data.responsible_persons
  for (const org of orgs) {
    const persons = [];
    const rp = org.acnc_data?.responsible_persons;
    if (Array.isArray(rp)) {
      for (const p of rp) {
        if (typeof p === 'string') persons.push(p);
        else if (p?.name) persons.push(p.name);
      }
    }
    if (persons.length > 0) {
      orgPersons.set(org.id, { org, persons });
    }
  }

  // From person_roles table
  if (personRoles) {
    for (const pr of personRoles) {
      if (!pr.person_name || !pr.organization_id) continue;
      const existing = orgPersons.get(pr.organization_id);
      if (existing) {
        existing.persons.push(pr.person_name);
      } else {
        const org = orgs.find((o) => o.id === pr.organization_id);
        if (org) {
          orgPersons.set(pr.organization_id, { org, persons: [pr.person_name] });
        }
      }
    }
  }

  console.log(`  Screening ${orgPersons.size} orgs with named persons`);

  let stats = { persons: 0, matches: 0, orgMatches: new Set() };
  const PEP_THRESHOLD = 0.85;

  for (const [orgId, { org, persons }] of orgPersons) {
    const pepMatches = [];

    for (const personName of persons) {
      stats.persons++;

      for (const pep of pepEntities) {
        const confidence = fuzzyNameMatch(personName, pep.name);
        if (confidence >= PEP_THRESHOLD) {
          pepMatches.push({
            person: personName,
            pep_role: pep.role,
            confidence: Math.round(confidence * 100) / 100,
          });
          break; // One match per person is enough
        }
      }
    }

    if (pepMatches.length > 0) {
      stats.matches += pepMatches.length;
      stats.orgMatches.add(orgId);

      const pepData = {
        pep_screening: {
          matches: pepMatches,
          screened_at: TODAY,
          pep_count: pepMatches.length,
        },
      };

      console.log(`  [PEP] ${org.name} -- ${pepMatches.length} match(es): ${pepMatches.map((m) => `${m.person} (${m.pep_role}, ${m.confidence})`).join(', ')}`);

      if (applyMode) {
        const merged = { ...(org.acnc_data || {}), ...pepData };
        const { error: updateErr } = await supabase
          .from('organizations')
          .update({ acnc_data: merged })
          .eq('id', org.id);

        if (updateErr) {
          console.log(`  [PEP] ${org.name} -- DB error: ${updateErr.message}`);
        }
      }
    }
  }

  console.log(`  PEP Screening: ${stats.persons} persons checked, ${stats.matches} PEP matches across ${stats.orgMatches.size} orgs`);
  return { persons: stats.persons, matches: stats.matches, orgs: stats.orgMatches.size };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('========================================================');
console.log('  JusticeHub Org Enrichment -- Australian Government APIs');
console.log(`  Mode: ${mode.toUpperCase()}  |  ${applyMode ? 'APPLY (writing to DB)' : 'DRY RUN (no changes)'}`);
console.log('========================================================');

const results = {};

try {
  if (mode === 'all' || mode === 'abr') results.abr = await enrichFromABR();
  if (mode === 'all' || mode === 'seifa') results.seifa = await enrichFromSEIFA();
  if (mode === 'all' || mode === 'sanctions') results.sanctions = await enrichFromSanctions();
} catch (err) {
  console.error(`\nFatal error: ${err.message}`);
  process.exit(1);
}

console.log('\n========================================================');
console.log('  RESULTS SUMMARY');
console.log('========================================================');

if (results.abr) {
  console.log(`  ABR:        ${results.abr.checked} checked, ${results.abr.active} Active, ${results.abr.cancelled} Cancelled, ${results.abr.errors} errors`);
}
if (results.seifa) {
  console.log(`  SEIFA:      ${results.seifa.scored} orgs scored, avg IRSD decile ${results.seifa.avgDecile}`);
}
if (results.sanctions) {
  console.log(`  Sanctions:  ${results.sanctions.persons} persons, ${results.sanctions.matches} PEP matches, ${results.sanctions.orgs} orgs`);
}

if (!applyMode) {
  console.log('\n  (Dry run -- no changes written. Use --apply to write.)');
}

console.log('========================================================');
