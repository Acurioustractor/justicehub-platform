#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Client } = pg;

const PROJECT_ROOT = process.cwd();
const OUTPUT_ROOT = path.join(PROJECT_ROOT, 'artifacts', 'civic-launch-readiness');
const STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
const PUBLIC_CLAIM_STATUSES = ['verified', 'snapshot'];
const ADELAIDE_CITY_KEYWORDS = [
  'adelaide',
  'north adelaide',
  'port adelaide',
  'cavan',
];
const SA_CURATION_SHORTLIST_LIMIT = 15;
const YOUTH_NAME_RE = /\b(youth|young|child|children|adolescent|teen|student|family|families)\b/i;
const JUSTICE_NAME_RE = /\b(justice|legal|rights|court|bail|detention|diversion|reintegration|custody|custodial|offenders?|prisoners?|prison|police)\b/i;
const FIRST_NATIONS_NAME_RE = /\b(aboriginal|first nations|indigenous|nunga|kaurna|narungga|ngarrindjeri|anangu|adnyamathanha|kokatha|pitjantjatjara|yankunytjatjara)\b/i;
const EXCLUDE_NAME_RE = /\b(university|school|kindergarten|college|council|department|ministers?|parliament|foundation|trust|pty|proprietary|consulting|consultants?|arts?|media|network|training)\b/i;

const ROUTE_FILES = [
  { route: '/intelligence/civic', file: 'src/app/intelligence/civic/page.tsx', kind: 'public' },
  { route: '/intelligence/civic/centre-of-excellence', file: 'src/app/intelligence/civic/centre-of-excellence/page.tsx', kind: 'public' },
  { route: '/intelligence/civic/data-quality', file: 'src/app/intelligence/civic/data-quality/page.tsx', kind: 'public' },
  { route: '/intelligence/civic/detention', file: 'src/app/intelligence/civic/detention/page.tsx', kind: 'public' },
  { route: '/intelligence/civic/foundations', file: 'src/app/intelligence/civic/foundations/page.tsx', kind: 'public' },
  { route: '/intelligence/civic/government-programs', file: 'src/app/intelligence/civic/government-programs/page.tsx', kind: 'public' },
  { route: '/intelligence/civic/locale', file: 'src/app/intelligence/civic/locale/page.tsx', kind: 'public' },
  {
    route: '/intelligence/civic/locale/adelaide',
    file: 'src/app/intelligence/civic/locale/[slug]/page.tsx',
    kind: 'public',
    requiredText: ['Coverage note', 'No ACCO-certified confirmed Tier 1 organisation is matched here yet'],
  },
  {
    route: '/intelligence/civic/state/sa',
    file: 'src/app/intelligence/civic/state/[code]/page.tsx',
    kind: 'public',
    requiredText: ['Launch caveat', '0 ACCO-certified confirmed Tier 1 organisations', 'Reports and recommendations indexed'],
  },
  {
    route: '/intelligence/civic/state/act',
    file: 'src/app/intelligence/civic/state/[code]/page.tsx',
    kind: 'public',
    requiredText: ['Reports and recommendations indexed', 'Recommendation'],
  },
  {
    route: '/intelligence/civic/state/tas',
    file: 'src/app/intelligence/civic/state/[code]/page.tsx',
    kind: 'public',
    requiredText: ['Reports and recommendations indexed', 'Recommendation'],
  },
  {
    route: '/intelligence/civic/state/wa',
    file: 'src/app/intelligence/civic/state/[code]/page.tsx',
    kind: 'public',
    requiredText: ['Reports and recommendations indexed', 'Recommendation'],
  },
  { route: '/intelligence/civic/orgs/[org-slug]', file: 'src/app/intelligence/civic/orgs/[org-slug]/page.tsx', kind: 'public-dynamic' },
  { route: '/intelligence/civic/people', file: 'src/app/intelligence/civic/people/page.tsx', kind: 'public' },
  { route: '/intelligence/civic/people/[slug]', file: 'src/app/intelligence/civic/people/[slug]/page.tsx', kind: 'public-dynamic' },
  { route: '/intelligence/civic/claim/[id]', file: 'src/app/intelligence/civic/claim/[id]/page.tsx', kind: 'public-dynamic' },
  { route: '/intelligence/civic/whats-new', file: 'src/app/intelligence/civic/whats-new/page.tsx', kind: 'public' },
  { route: '/intelligence/civic/print', file: 'src/app/intelligence/civic/print/page.tsx', kind: 'public' },
  { route: '/intelligence/civic/methodology', file: 'src/app/intelligence/civic/methodology/page.tsx', kind: 'public' },
  { route: '/admin/kiosk/status', file: 'src/app/admin/kiosk/status/page.tsx', kind: 'operator' },
  { route: '/admin/data-sufficiency', file: 'src/app/admin/data-sufficiency/page.tsx', kind: 'operator' },
  { route: '/admin/data-sufficiency/findings', file: 'src/app/admin/data-sufficiency/findings/page.tsx', kind: 'operator' },
  { route: '/admin/civic/tier-1-curation', file: 'src/app/admin/civic/tier-1-curation/page.tsx', kind: 'operator' },
];

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local'), quiet: true });

function parseArgs(argv) {
  const args = {
    baseUrl: process.env.CIVIC_LAUNCH_BASE_URL || process.env.FRONTEND_SMOKE_BASE_URL || process.env.BASE_URL || '',
    skipDb: false,
    skipHttp: false,
    outputDir: OUTPUT_ROOT,
    strictWarnings: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--skip-db') args.skipDb = true;
    if (arg === '--skip-http') args.skipHttp = true;
    if (arg === '--strict-warnings') args.strictWarnings = true;
    if (arg === '--base-url') {
      args.baseUrl = argv[i + 1] || '';
      i += 1;
    }
    if (arg === '--output-dir') {
      args.outputDir = path.resolve(PROJECT_ROOT, argv[i + 1] || OUTPUT_ROOT);
      i += 1;
    }
  }

  args.baseUrl = args.baseUrl.replace(/\/$/, '');
  return args;
}

function getConnectionCandidates() {
  const candidates = [
    ['DATABASE_URL', process.env.DATABASE_URL],
    ['SUPABASE_CONNECTION_STRING', process.env.SUPABASE_CONNECTION_STRING],
    ['SUPABASE_DB_URL', process.env.SUPABASE_DB_URL],
    ['SUPABASE_DATABASE_URL', process.env.SUPABASE_DATABASE_URL],
  ];

  const seen = new Set();
  return candidates
    .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
    .filter(([, value]) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    })
    .map(([name, value]) => ({ name, connectionString: value }));
}

function getSupabaseApiConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

function numberValue(value) {
  if (value == null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pct(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numberValue(numerator) / numberValue(denominator)) * 1000) / 10;
}

function money(value) {
  if (value == null || value === '') return 'n/a';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(numberValue(value));
}

function scoreSaCurationCandidate(row) {
  if (!row || row.is_confirmed_tier1) return null;

  const name = String(row.name || '');
  const text = `${name} ${row.description || ''}`;
  const hasYouthSignal = YOUTH_NAME_RE.test(text);
  const hasJusticeSignal = JUSTICE_NAME_RE.test(text);
  const signals = [];
  let score = 0;

  if (row.acco_certified) {
    score += 8;
    signals.push('ACCO-certified');
  }
  if (row.is_indigenous_org) {
    score += 4;
    signals.push('Indigenous-led flag');
  }
  if (row.ben_youth) {
    score += 3;
    signals.push('ACNC youth beneficiary');
  }
  if (row.ben_aboriginal_tsi) {
    score += 2;
    signals.push('ACNC Aboriginal/TSI beneficiary');
  }
  if (hasYouthSignal) {
    score += 3;
    signals.push('youth/family text signal');
  }
  if (hasJusticeSignal) {
    score += 4;
    signals.push('justice/legal text signal');
  }
  if (FIRST_NATIONS_NAME_RE.test(text)) {
    score += 3;
    signals.push('First Nations text signal');
  }
  if (numberValue(row.total_justice_funding_received) > 0) {
    score += 2;
    signals.push('tracked justice funding');
  }
  if (numberValue(row.foundation_dollars_received) > 0) {
    score += 1;
    signals.push('tracked foundation funding');
  }
  if (EXCLUDE_NAME_RE.test(name)) {
    score -= 4;
    signals.push('likely system/funder/generalist review');
  }

  if (!hasYouthSignal && !hasJusticeSignal && numberValue(row.total_justice_funding_received) === 0) return null;
  if (score < 10) return null;

  return {
    organization_id: row.organization_id || row.id,
    name: row.name,
    slug: row.slug,
    city: row.city,
    score,
    acco_certified: Boolean(row.acco_certified),
    is_indigenous_org: Boolean(row.is_indigenous_org),
    ben_youth: Boolean(row.ben_youth),
    ben_aboriginal_tsi: Boolean(row.ben_aboriginal_tsi),
    justice_funding: numberValue(row.total_justice_funding_received),
    justice_funding_records: numberValue(row.justice_funding_records),
    foundation_dollars: numberValue(row.foundation_dollars_received),
    foundation_grants: numberValue(row.foundation_grants_received),
    signals,
  };
}

function buildSaCurationShortlist(rows) {
  const deduped = new Map();
  for (const candidate of rows
    .map(scoreSaCurationCandidate)
    .filter(Boolean)) {
    const key = `${String(candidate.name || '').trim().toLowerCase()}::${String(candidate.city || '').trim().toLowerCase()}`;
    const existing = deduped.get(key);
    if (
      !existing ||
      candidate.score > existing.score ||
      candidate.justice_funding > existing.justice_funding ||
      candidate.foundation_dollars > existing.foundation_dollars
    ) {
      deduped.set(key, candidate);
    }
  }

  return Array.from(deduped.values())
    .sort((a, b) =>
      b.score - a.score ||
      Number(b.acco_certified) - Number(a.acco_certified) ||
      b.justice_funding - a.justice_funding ||
      String(a.name || '').localeCompare(String(b.name || ''))
    )
    .slice(0, SA_CURATION_SHORTLIST_LIMIT);
}

function normalizedName(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function routeFileChecks() {
  return ROUTE_FILES.map((item) => {
    const absolutePath = path.join(PROJECT_ROOT, item.file);
    return {
      ...item,
      exists: Boolean(absolutePath && path.isAbsolute(absolutePath)) && fs.stat(absolutePath).then(() => true).catch(() => false),
    };
  });
}

async function resolveRouteFiles() {
  const checks = await Promise.all(routeFileChecks().map(async (check) => ({
    ...check,
    exists: await check.exists,
  })));
  return checks;
}

async function fetchStatus(url) {
  const controller = new AbortController();
  const startedAt = Date.now();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'manual',
      headers: { accept: 'text/html,*/*' },
    });
    let body = '';
    try {
      body = await response.text();
    } catch {
      body = '';
    }
    return { status: response.status, durationMs: Date.now() - startedAt, body };
  } catch {
    return { status: 0, durationMs: Date.now() - startedAt, body: '' };
  } finally {
    clearTimeout(timeout);
  }
}

function buildDynamicSmokeRoutes(snapshot) {
  if (!snapshot) return [];
  const routes = [];

  const orgSlug = snapshot.dynamicSamples?.orgSlug || snapshot.adelaideLocale?.confirmedTier1?.find((org) => org.slug)?.slug;
  const personSlug = snapshot.dynamicSamples?.personSlug;
  const claimId = snapshot.dynamicSamples?.claimId;

  if (orgSlug) {
    routes.push({ route: `/intelligence/civic/orgs/${encodeURIComponent(orgSlug)}`, kind: 'public-dynamic' });
  }
  if (personSlug) {
    routes.push({ route: `/intelligence/civic/people/${encodeURIComponent(personSlug)}`, kind: 'public-dynamic' });
  }
  if (claimId) {
    routes.push({ route: `/intelligence/civic/claim/${encodeURIComponent(claimId)}`, kind: 'public-dynamic' });
  }

  return routes;
}

async function httpRouteChecks(baseUrl, dynamicRoutes = []) {
  if (!baseUrl) return { skipped: true, routes: [] };

  const checkable = [
    ...ROUTE_FILES.filter((item) => item.kind !== 'public-dynamic'),
    ...dynamicRoutes,
  ];
  const routes = [];
  const seen = new Set();
  for (const item of checkable) {
    if (seen.has(item.route)) continue;
    seen.add(item.route);
    // eslint-disable-next-line no-await-in-loop
    const { status, durationMs, body } = await fetchStatus(`${baseUrl}${item.route}`);
    const requiredText = item.requiredText || [];
    const missingText = requiredText.filter((text) => !body.includes(text));
    routes.push({
      route: item.route,
      kind: item.kind,
      status,
      durationMs,
      missingText,
      ok: status >= 200 && status < 400,
    });
  }

  return { skipped: false, baseUrl, routes };
}

async function runQuery(client, query, params = []) {
  const result = await client.query(query, params);
  return result.rows;
}

async function fetchAll(supabase, table, select, filter, options = {}) {
  const pageSize = options.pageSize || 1000;
  const maxRows = options.maxRows || 10000;
  const rows = [];

  for (let from = 0; from <= maxRows; from += pageSize) {
    let query = supabase.from(table).select(select).range(from, from + pageSize - 1);
    if (filter) query = filter(query);

    // eslint-disable-next-line no-await-in-loop
    const { data, error } = await query;
    if (error) throw new Error(`${table}: ${error.message}`);

    const page = data || [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }

  throw new Error(`${table}: exceeded REST fallback max row limit of ${maxRows}`);
}

async function countRows(supabase, table, column = 'id', filter) {
  let query = supabase.from(table).select(column, { count: 'exact', head: true });
  if (filter) query = filter(query);
  const { count, error } = await query;
  if (error) throw new Error(`${table}: ${error.message}`);
  return count || 0;
}

async function fetchOrganizationsByIds(supabase, ids) {
  const rows = [];
  const chunkSize = 80;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    // eslint-disable-next-line no-await-in-loop
    const { data, error } = await supabase
      .from('organizations')
      .select('id,name,slug,state,city,is_indigenous_org,acco_certified,archived,acnc_data')
      .in('id', chunk);
    if (error) throw new Error(`organizations: ${error.message}`);
    rows.push(...(data || []));
  }
  return rows;
}

function countBy(rows, key) {
  const counts = new Map();
  for (const row of rows) {
    const value = row[key] || 'unknown';
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return Array.from(counts, ([name, count]) => ({ name, count }));
}

function normalizeJurisdiction(value) {
  const raw = String(value || 'unknown').trim();
  if (!raw) return 'unknown';
  if (raw.toLowerCase() === 'national') return 'National';
  const upper = raw.toUpperCase();
  if (STATES.includes(upper)) return upper;
  return raw;
}

function emptyOversightCoverage(jurisdiction) {
  return {
    jurisdiction,
    recommendation_rows: 0,
    children_commissioner_reports: 0,
    children_yj_relevant_reports: 0,
    children_detention_reports: 0,
    children_indigenous_overrep_reports: 0,
    auditor_general_audits: 0,
    total_evidence_rows: 0,
  };
}

function sortOversightCoverage(rows) {
  const order = new Map([...STATES, 'National'].map((state, index) => [state, index]));
  return rows.sort((a, b) => {
    const ai = order.has(a.jurisdiction) ? order.get(a.jurisdiction) : 999;
    const bi = order.has(b.jurisdiction) ? order.get(b.jurisdiction) : 999;
    return ai - bi || String(a.jurisdiction).localeCompare(String(b.jurisdiction));
  });
}

function buildOversightCoverage({ recommendations = [], childrenReports = [], auditorAudits = [] }) {
  const coverage = new Map(STATES.map((state) => [state, emptyOversightCoverage(state)]));

  const getRow = (jurisdictionValue) => {
    const jurisdiction = normalizeJurisdiction(jurisdictionValue);
    if (!coverage.has(jurisdiction)) coverage.set(jurisdiction, emptyOversightCoverage(jurisdiction));
    return coverage.get(jurisdiction);
  };

  for (const row of recommendations) {
    getRow(row.jurisdiction).recommendation_rows += 1;
  }
  for (const row of childrenReports) {
    const coverageRow = getRow(row.jurisdiction);
    coverageRow.children_commissioner_reports += 1;
    if (row.yj_relevant) coverageRow.children_yj_relevant_reports += 1;
    if (row.detention_mentioned) coverageRow.children_detention_reports += 1;
    if (row.indigenous_overrep_mentioned) coverageRow.children_indigenous_overrep_reports += 1;
  }
  for (const row of auditorAudits) {
    getRow(row.jurisdiction).auditor_general_audits += 1;
  }

  for (const row of coverage.values()) {
    row.total_evidence_rows =
      row.recommendation_rows +
      row.children_commissioner_reports +
      row.auditor_general_audits;
  }

  return sortOversightCoverage(Array.from(coverage.values()));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isChildrenRecommendationCandidate(rec) {
  if (!rec || typeof rec !== 'object') return false;
  const text = String(rec.text || '').replace(/\s+/g, ' ').trim();
  if (text.length < 20) return false;
  return Boolean(rec.yj_relevant || rec.raise_age_relevant || rec.indigenous_overrep);
}

function isAuditorRecommendationCandidate(rec) {
  if (!rec || typeof rec !== 'object') return false;
  return String(rec.text || '').replace(/\s+/g, ' ').trim().length >= 20;
}

function emptyOversightExtractionRow(jurisdiction) {
  return {
    jurisdiction,
    children_candidate_recommendations: 0,
    auditor_candidate_recommendations: 0,
    total_candidate_recommendations: 0,
  };
}

function buildOversightRecommendationExtraction(rows = {}) {
  const extraction = new Map(STATES.map((state) => [state, emptyOversightExtractionRow(state)]));
  const getRow = (jurisdictionValue) => {
    const jurisdiction = normalizeJurisdiction(jurisdictionValue);
    if (!extraction.has(jurisdiction)) extraction.set(jurisdiction, emptyOversightExtractionRow(jurisdiction));
    return extraction.get(jurisdiction);
  };

  for (const row of rows.childrenReports || []) {
    const count = asArray(row.recommendations).filter(isChildrenRecommendationCandidate).length;
    const extractionRow = getRow(row.jurisdiction);
    extractionRow.children_candidate_recommendations += count;
    extractionRow.total_candidate_recommendations += count;
  }
  for (const row of rows.auditorAudits || []) {
    const count = asArray(row.key_recommendations).filter(isAuditorRecommendationCandidate).length;
    const extractionRow = getRow(row.jurisdiction);
    extractionRow.auditor_candidate_recommendations += count;
    extractionRow.total_candidate_recommendations += count;
  }

  return sortOversightCoverage(Array.from(extraction.values()));
}

function oversightLaunchStatus(row) {
  if (numberValue(row.total_evidence_rows) === 0) return 'missing evidence';
  if (numberValue(row.recommendation_rows) === 0) return 'evidence only - extract recommendations';
  if (numberValue(row.total_evidence_rows) >= 3) return 'multi-source coverage';
  return 'recommendations indexed';
}

function oversightNextStep(row) {
  if (numberValue(row.total_evidence_rows) === 0) {
    return 'Discover and ingest core commissioner, auditor-general, ombudsman or sentencing sources.';
  }
  if (numberValue(row.recommendation_rows) === 0) {
    return 'Extract report recommendations into oversight_recommendations from the existing evidence rows.';
  }
  if (numberValue(row.children_commissioner_reports) === 0 || numberValue(row.auditor_general_audits) === 0) {
    return 'Add commissioner or auditor context to strengthen the state page.';
  }
  return 'Launchable; keep source freshness checks running.';
}

async function readDatabaseSnapshotFromSupabaseApi(supabase) {
  const totalClaims = await countRows(supabase, 'civic_intelligence_claims', 'claim_id');
  const publicClaims = await fetchAll(
    supabase,
    'civic_intelligence_claims',
    'claim_id,source_doc_urls',
    (query) => query.in('verification_status', PUBLIC_CLAIM_STATUSES),
    { maxRows: 5000 }
  );
  const evidenceRows = await fetchAll(
    supabase,
    'v_claim_evidence_summary',
    'claim_id,triangulation_tier,total_evidence_rows',
    null,
    { maxRows: 5000 }
  );
  const publicClaim = publicClaims.find((claim) => claim.claim_id);

  const evidenceByClaim = new Map(evidenceRows.map((row) => [row.claim_id, row]));
  const publicEvidence = publicClaims.map((claim) => evidenceByClaim.get(claim.claim_id) || {
    claim_id: claim.claim_id,
    triangulation_tier: 'no_evidence',
    total_evidence_rows: 0,
  });

  const classifications = await fetchAll(
    supabase,
    'civic_org_classifications',
    'organization_id,tier,confirmed_at',
    (query) => query.eq('tier', 1).not('confirmed_at', 'is', null),
    { maxRows: 5000 }
  );
  const confirmedTier1Ids = new Set(classifications.map((row) => row.organization_id).filter(Boolean));
  const organizationIds = Array.from(new Set(classifications.map((row) => row.organization_id).filter(Boolean)));
  const organizations = await fetchOrganizationsByIds(supabase, organizationIds);
  const orgById = new Map(organizations.map((row) => [row.id, row]));
  const tier1Orgs = classifications
    .map((row) => orgById.get(row.organization_id))
    .filter((row) => row && row.archived !== true);
  const confirmedTier1NameKeys = new Set(tier1Orgs.map((row) => normalizedName(row.name)).filter(Boolean));

  const adelaideOrgs = tier1Orgs
    .filter((row) => row.state === 'SA' && ADELAIDE_CITY_KEYWORDS.includes(String(row.city || '').toLowerCase()))
    .sort((a, b) => String(a.city || '').localeCompare(String(b.city || '')) || String(a.name || '').localeCompare(String(b.name || '')));

  const { data: detentionData, error: detentionError } = await supabase
    .from('organizations')
    .select('name,slug,city,acnc_data')
    .eq('slug', 'adelaide-youth-training-centre')
    .limit(1);
  if (detentionError) throw new Error(`organizations detention lookup: ${detentionError.message}`);

  const { data: personData, error: personError } = await supabase
    .from('people')
    .select('slug')
    .not('slug', 'is', null)
    .order('slug')
    .limit(1);
  if (personError) throw new Error(`people dynamic smoke lookup: ${personError.message}`);

  const foundationTotal = await countRows(supabase, 'foundation_grantees', 'id');
  const foundationClassified = await countRows(
    supabase,
    'foundation_grantees',
    'id',
    (query) => query.not('yj_classified_at', 'is', null)
  );
  const yjFoundationRows = await fetchAll(
    supabase,
    'foundation_grantees',
    'grant_amount',
    (query) => query.eq('yj_relevant', true),
    { maxRows: 10000 }
  );

  const oversightRows = await fetchAll(
    supabase,
    'oversight_recommendations',
    'jurisdiction',
    null,
    { maxRows: 5000 }
  );
  const childrenCommissionerRows = await fetchAll(
    supabase,
    'children_commissioner_reports',
    'jurisdiction,yj_relevant,detention_mentioned,indigenous_overrep_mentioned,recommendations',
    null,
    { maxRows: 5000 }
  );
  const auditorGeneralRows = await fetchAll(
    supabase,
    'auditor_general_audits',
    'jurisdiction,key_recommendations',
    null,
    { maxRows: 5000 }
  );

  let fundingByState = [];
  const { data: fundingAggregate, error: fundingAggregateError } = await supabase
    .from('justice_funding')
    .select('state,row_count:id.count(),dollars:amount_dollars.sum()');
  if (!fundingAggregateError && Array.isArray(fundingAggregate)) {
    fundingByState = fundingAggregate.map((row) => ({
      state: row.state || 'unknown',
      row_count: numberValue(row.row_count),
      dollars: row.dollars,
    }));
  } else {
    const fundingStates = ['ACT', 'National', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
    for (const state of fundingStates) {
      // eslint-disable-next-line no-await-in-loop
      const rowCount = await countRows(
        supabase,
        'justice_funding',
        'id',
        (query) => query.eq('state', state)
      );
      fundingByState.push({ state, row_count: rowCount, dollars: null });
    }
    // eslint-disable-next-line no-await-in-loop
    const unknownCount = await countRows(
      supabase,
      'justice_funding',
      'id',
      (query) => query.is('state', null)
    );
    if (unknownCount > 0) fundingByState.push({ state: 'unknown', row_count: unknownCount, dollars: null });
  }
  fundingByState.sort((a, b) => String(a.state).localeCompare(String(b.state)));

  const saBudget2025Rows = await fetchAll(
    supabase,
    'justice_funding',
    'source_statement_id,amount_dollars',
    (query) => query.eq('source', 'sa-budget-2025-26'),
    { maxRows: 100 }
  );

  const plannedSources = await fetchAll(
    supabase,
    'data_sources_inventory',
    'topic',
    (query) => query.eq('status', 'planned'),
    { maxRows: 10000 }
  );
  const openGaps = await fetchAll(
    supabase,
    'data_gap_questions',
    'topic,priority,status',
    (query) => query.not('status', 'in', '("closed","resolved","done")'),
    { maxRows: 10000 }
  );
  const saOrgRows = await fetchAll(
    supabase,
    'organizations',
    'id,name,slug,city,state,acco_certified,is_indigenous_org,description,type,is_active,archived',
    (query) => query.eq('state', 'SA').eq('is_active', true).neq('archived', true),
    { maxRows: 20000 }
  );
  const saCandidateRows = saOrgRows.map((row) => ({
    ...row,
    organization_id: row.id,
    is_confirmed_tier1: confirmedTier1Ids.has(row.id) || confirmedTier1NameKeys.has(normalizedName(row.name)),
    ben_youth: false,
    ben_aboriginal_tsi: false,
    total_justice_funding_received: 0,
    justice_funding_records: 0,
    foundation_dollars_received: 0,
    foundation_grants_received: 0,
  }));

  const publicClaimsMissingSourceDocs = publicClaims.filter((claim) => {
    const urls = claim.source_doc_urls;
    if (Array.isArray(urls)) return urls.length === 0;
    return !urls || (typeof urls === 'object' && Object.keys(urls).length === 0);
  }).length;

  const oversightByJurisdiction = countBy(oversightRows, 'jurisdiction')
    .map((row) => ({ jurisdiction: normalizeJurisdiction(row.name), row_count: row.count }))
    .sort((a, b) => String(a.jurisdiction).localeCompare(String(b.jurisdiction)));
  const oversightCoverage = buildOversightCoverage({
    recommendations: oversightRows,
    childrenReports: childrenCommissionerRows,
    auditorAudits: auditorGeneralRows,
  });
  const oversightRecommendationExtraction = buildOversightRecommendationExtraction({
    childrenReports: childrenCommissionerRows,
    auditorAudits: auditorGeneralRows,
  });

  const plannedSourceBacklog = countBy(plannedSources, 'topic')
    .map((row) => ({ topic: row.name, planned_count: row.count }))
    .sort((a, b) => b.planned_count - a.planned_count || String(a.topic).localeCompare(String(b.topic)));

  const gapCounts = new Map();
  for (const row of openGaps) {
    const key = `${row.topic || 'unknown'}::${row.priority || 'unknown'}`;
    const current = gapCounts.get(key) || {
      topic: row.topic || 'unknown',
      priority: row.priority || 'unknown',
      open_count: 0,
    };
    current.open_count += 1;
    gapCounts.set(key, current);
  }

  return {
    claimTraceability: {
      total_claims: totalClaims,
      public_claims: publicClaims.length,
      public_claims_missing_source_docs: publicClaimsMissingSourceDocs,
    },
    evidence: {
      triangulated_claims: publicEvidence.filter((row) => row.triangulation_tier === 'triangulated').length,
      corroborated_claims: publicEvidence.filter((row) => row.triangulation_tier === 'corroborated').length,
      public_claims_without_evidence: publicEvidence.filter((row) => numberValue(row.total_evidence_rows) === 0 || row.triangulation_tier === 'no_evidence').length,
    },
    tier1: {
      confirmed_tier1: tier1Orgs.length,
      sa_confirmed_tier1: tier1Orgs.filter((row) => row.state === 'SA').length,
      sa_indigenous_led_tier1: tier1Orgs.filter((row) => row.state === 'SA' && row.is_indigenous_org).length,
      sa_acco_certified_tier1: tier1Orgs.filter((row) => row.state === 'SA' && row.acco_certified).length,
      act_tas_confirmed_tier1: tier1Orgs.filter((row) => row.state === 'ACT' || row.state === 'TAS').length,
    },
    adelaideLocale: {
      confirmedTier1: adelaideOrgs.map((row) => ({
        name: row.name,
        slug: row.slug,
        city: row.city,
        is_indigenous_org: Boolean(row.is_indigenous_org),
        acco_certified: Boolean(row.acco_certified),
      })),
      count: adelaideOrgs.length,
      indigenousLedCount: adelaideOrgs.filter((row) => row.is_indigenous_org).length,
      accoCertifiedCount: adelaideOrgs.filter((row) => row.acco_certified).length,
    },
    saCurationShortlist: buildSaCurationShortlist(saCandidateRows),
    detentionCentre: detentionData?.[0]
      ? {
          name: detentionData[0].name,
          slug: detentionData[0].slug,
          city: detentionData[0].city,
          detention_meta: detentionData[0].acnc_data?.detention_meta || null,
        }
      : null,
    dynamicSamples: {
      orgSlug: adelaideOrgs.find((row) => row.slug)?.slug || tier1Orgs.find((row) => row.slug)?.slug || null,
      personSlug: personData?.[0]?.slug || null,
      claimId: publicClaim?.claim_id || null,
    },
    foundation: {
      total_foundation_rows: foundationTotal,
      classified_rows: foundationClassified,
      yj_relevant_rows: yjFoundationRows.length,
      yj_relevant_dollars: yjFoundationRows.reduce((total, row) => total + numberValue(row.grant_amount), 0),
      classifiedPct: pct(foundationClassified, foundationTotal),
    },
    oversightByJurisdiction,
    oversightCoverage,
    oversightRecommendationExtraction,
    fundingByState,
    saBudget2025: {
      row_count: saBudget2025Rows.length,
      dollars: saBudget2025Rows.reduce((total, row) => total + numberValue(row.amount_dollars), 0),
    },
    plannedSourceBacklog,
    openGapBacklog: Array.from(gapCounts.values())
      .sort((a, b) => b.open_count - a.open_count || String(a.topic).localeCompare(String(b.topic))),
  };
}

async function readDatabaseSnapshot(client) {
  const [
    claimRows,
    evidenceRows,
    tier1Rows,
    adelaideRows,
    detentionRows,
    foundationRows,
    oversightRows,
    oversightExtractionRows,
    fundingRows,
    saBudget2025Rows,
    sourceBacklogRows,
    gapRows,
    dynamicClaimRows,
    dynamicPersonRows,
    saCandidateRows,
  ] = await Promise.all([
    runQuery(client, `
      select
        count(*)::int as total_claims,
        (count(*) filter (where verification_status = any($1::text[])))::int as public_claims,
        (count(*) filter (
          where verification_status = any($1::text[])
            and (
              source_doc_urls is null
              or (
                case
                  when jsonb_typeof(source_doc_urls) = 'array' then jsonb_array_length(source_doc_urls)
                  when jsonb_typeof(source_doc_urls) = 'object' then 1
                  else 0
                end
              ) = 0
            )
        ))::int as public_claims_missing_source_docs
      from public.civic_intelligence_claims
    `, [PUBLIC_CLAIM_STATUSES]),
    runQuery(client, `
      select
        (count(*) filter (where coalesce(s.triangulation_tier, 'no_evidence') = 'triangulated'))::int as triangulated_claims,
        (count(*) filter (where coalesce(s.triangulation_tier, '') = 'corroborated'))::int as corroborated_claims,
        (count(*) filter (
          where coalesce(s.total_evidence_rows, 0) = 0
             or coalesce(s.triangulation_tier, 'no_evidence') = 'no_evidence'
        ))::int as public_claims_without_evidence
      from public.civic_intelligence_claims c
      left join public.v_claim_evidence_summary s on s.claim_id = c.claim_id
      where c.verification_status = any($1::text[])
    `, [PUBLIC_CLAIM_STATUSES]),
    runQuery(client, `
      select
        count(*)::int as confirmed_tier1,
        (count(*) filter (where o.state = 'SA'))::int as sa_confirmed_tier1,
        (count(*) filter (where o.state = 'SA' and coalesce(o.is_indigenous_org, false)))::int as sa_indigenous_led_tier1,
        (count(*) filter (where o.state = 'SA' and coalesce(o.acco_certified, false)))::int as sa_acco_certified_tier1,
        (count(*) filter (where o.state in ('ACT', 'TAS')))::int as act_tas_confirmed_tier1
      from public.civic_org_classifications c
      join public.organizations o on o.id = c.organization_id
      where c.tier = 1
        and c.confirmed_at is not null
        and o.archived is not true
    `),
    runQuery(client, `
      select
        o.name,
        o.slug,
        o.city,
        coalesce(o.is_indigenous_org, false) as is_indigenous_org,
        coalesce(o.acco_certified, false) as acco_certified
      from public.civic_org_classifications c
      join public.organizations o on o.id = c.organization_id
      where c.tier = 1
        and c.confirmed_at is not null
        and o.archived is not true
        and o.state = 'SA'
        and lower(coalesce(o.city, '')) = any($1::text[])
      order by o.city nulls last, o.name
    `, [ADELAIDE_CITY_KEYWORDS]),
    runQuery(client, `
      select name, slug, city, acnc_data->'detention_meta' as detention_meta
      from public.organizations
      where slug = 'adelaide-youth-training-centre'
      limit 1
    `),
    runQuery(client, `
      select
        count(*)::int as total_foundation_rows,
        (count(*) filter (where yj_classified_at is not null))::int as classified_rows,
        (count(*) filter (where yj_relevant is true))::int as yj_relevant_rows,
        coalesce(sum(grant_amount) filter (where yj_relevant is true), 0)::numeric as yj_relevant_dollars
      from public.foundation_grantees
    `),
    runQuery(client, `
      with recs as (
        select
          case
            when lower(coalesce(jurisdiction, 'unknown')) = 'national' then 'National'
            when upper(coalesce(jurisdiction, 'unknown')) = any($1::text[]) then upper(coalesce(jurisdiction, 'unknown'))
            else coalesce(jurisdiction, 'unknown')
          end as jurisdiction,
          count(*)::int as recommendation_rows
        from public.oversight_recommendations
        group by 1
      ),
      children as (
        select
          case
            when lower(coalesce(jurisdiction, 'unknown')) = 'national' then 'National'
            when upper(coalesce(jurisdiction, 'unknown')) = any($1::text[]) then upper(coalesce(jurisdiction, 'unknown'))
            else coalesce(jurisdiction, 'unknown')
          end as jurisdiction,
          count(*)::int as children_commissioner_reports,
          (count(*) filter (where coalesce(yj_relevant, false)))::int as children_yj_relevant_reports,
          (count(*) filter (where coalesce(detention_mentioned, false)))::int as children_detention_reports,
          (count(*) filter (where coalesce(indigenous_overrep_mentioned, false)))::int as children_indigenous_overrep_reports
        from public.children_commissioner_reports
        group by 1
      ),
      audits as (
        select
          case
            when lower(coalesce(jurisdiction, 'unknown')) = 'national' then 'National'
            when upper(coalesce(jurisdiction, 'unknown')) = any($1::text[]) then upper(coalesce(jurisdiction, 'unknown'))
            else coalesce(jurisdiction, 'unknown')
          end as jurisdiction,
          count(*)::int as auditor_general_audits
        from public.auditor_general_audits
        group by 1
      ),
      jurisdictions as (
        select unnest($1::text[]) as jurisdiction
        union
        select jurisdiction from recs
        union
        select jurisdiction from children
        union
        select jurisdiction from audits
      )
      select
        j.jurisdiction,
        coalesce(r.recommendation_rows, 0)::int as recommendation_rows,
        coalesce(c.children_commissioner_reports, 0)::int as children_commissioner_reports,
        coalesce(c.children_yj_relevant_reports, 0)::int as children_yj_relevant_reports,
        coalesce(c.children_detention_reports, 0)::int as children_detention_reports,
        coalesce(c.children_indigenous_overrep_reports, 0)::int as children_indigenous_overrep_reports,
        coalesce(a.auditor_general_audits, 0)::int as auditor_general_audits,
        (
          coalesce(r.recommendation_rows, 0)
          + coalesce(c.children_commissioner_reports, 0)
          + coalesce(a.auditor_general_audits, 0)
        )::int as total_evidence_rows
      from jurisdictions j
      left join recs r on r.jurisdiction = j.jurisdiction
      left join children c on c.jurisdiction = j.jurisdiction
      left join audits a on a.jurisdiction = j.jurisdiction
    `, [STATES]),
    runQuery(client, `
      with children_candidates as (
        select
          case
            when upper(coalesce(c.jurisdiction, 'unknown')) = any($1::text[]) then upper(coalesce(c.jurisdiction, 'unknown'))
            else coalesce(c.jurisdiction, 'unknown')
          end as jurisdiction,
          count(*)::int as children_candidate_recommendations
        from public.children_commissioner_reports c
        cross join lateral jsonb_array_elements(
          case when jsonb_typeof(c.recommendations) = 'array' then c.recommendations else '[]'::jsonb end
        ) rec
        where length(trim(coalesce(rec->>'text', ''))) >= 20
          and (
            coalesce(rec->>'yj_relevant', 'false') = 'true'
            or coalesce(rec->>'raise_age_relevant', 'false') = 'true'
            or coalesce(rec->>'indigenous_overrep', 'false') = 'true'
          )
        group by 1
      ),
      auditor_candidates as (
        select
          case
            when upper(coalesce(a.jurisdiction, 'unknown')) = any($1::text[]) then upper(coalesce(a.jurisdiction, 'unknown'))
            else coalesce(a.jurisdiction, 'unknown')
          end as jurisdiction,
          count(*)::int as auditor_candidate_recommendations
        from public.auditor_general_audits a
        cross join lateral jsonb_array_elements(
          case when jsonb_typeof(a.key_recommendations) = 'array' then a.key_recommendations else '[]'::jsonb end
        ) rec
        where length(trim(coalesce(rec->>'text', ''))) >= 20
        group by 1
      ),
      jurisdictions as (
        select unnest($1::text[]) as jurisdiction
        union
        select jurisdiction from children_candidates
        union
        select jurisdiction from auditor_candidates
      )
      select
        j.jurisdiction,
        coalesce(c.children_candidate_recommendations, 0)::int as children_candidate_recommendations,
        coalesce(a.auditor_candidate_recommendations, 0)::int as auditor_candidate_recommendations,
        (
          coalesce(c.children_candidate_recommendations, 0)
          + coalesce(a.auditor_candidate_recommendations, 0)
        )::int as total_candidate_recommendations
      from jurisdictions j
      left join children_candidates c on c.jurisdiction = j.jurisdiction
      left join auditor_candidates a on a.jurisdiction = j.jurisdiction
    `, [STATES]),
    runQuery(client, `
      select coalesce(state, 'unknown') as state, count(*)::int as row_count, coalesce(sum(amount_dollars), 0)::numeric as dollars
      from public.justice_funding
      group by coalesce(state, 'unknown')
      order by coalesce(state, 'unknown')
    `),
    runQuery(client, `
      select count(*)::int as row_count, coalesce(sum(amount_dollars), 0)::numeric as dollars
      from public.justice_funding
      where source = 'sa-budget-2025-26'
    `),
    runQuery(client, `
      select topic, count(*)::int as planned_count
      from public.data_sources_inventory
      where status = 'planned'
      group by topic
      order by planned_count desc, topic
    `),
    runQuery(client, `
      select topic, priority, count(*)::int as open_count
      from public.data_gap_questions
      where coalesce(status, '') not in ('closed', 'resolved', 'done')
      group by topic, priority
      order by open_count desc, topic, priority
    `),
    runQuery(client, `
      select claim_id
      from public.civic_intelligence_claims
      where verification_status = any($1::text[])
      order by claim_id
      limit 1
    `, [PUBLIC_CLAIM_STATUSES]),
    runQuery(client, `
      select slug
      from public.people
      where slug is not null
      order by slug
      limit 1
    `),
    runQuery(client, `
      select
        o.id as organization_id,
        o.name,
        o.slug,
        o.city,
        o.state,
        o.description,
        coalesce(o.acco_certified, false) as acco_certified,
        coalesce(o.is_indigenous_org, false) as is_indigenous_org,
        false as ben_youth,
        false as ben_aboriginal_tsi,
        (
          bool_or(c.tier = 1 and c.confirmed_at is not null)
          or exists (
            select 1
            from public.organizations o2
            join public.civic_org_classifications c2 on c2.organization_id = o2.id
            where o2.state = 'SA'
              and lower(trim(o2.name)) = lower(trim(o.name))
              and c2.tier = 1
              and c2.confirmed_at is not null
          )
        ) as is_confirmed_tier1,
        0::numeric as total_justice_funding_received,
        0::int as justice_funding_records,
        0::numeric as foundation_dollars_received,
        0::int as foundation_grants_received
      from public.organizations o
      left join public.civic_org_classifications c on c.organization_id = o.id
      where o.state = 'SA'
        and o.is_active = true
        and o.archived is not true
      group by o.id, o.name, o.slug, o.city, o.state, o.description, o.acco_certified, o.is_indigenous_org
    `),
  ]);

  const claimTraceability = claimRows[0] || {};
  const evidence = evidenceRows[0] || {};
  const tier1 = tier1Rows[0] || {};
  const foundation = foundationRows[0] || {};
  const oversightCoverage = sortOversightCoverage(oversightRows);

  return {
    claimTraceability,
    evidence,
    tier1,
    adelaideLocale: {
      confirmedTier1: adelaideRows,
      count: adelaideRows.length,
      indigenousLedCount: adelaideRows.filter((row) => row.is_indigenous_org).length,
      accoCertifiedCount: adelaideRows.filter((row) => row.acco_certified).length,
    },
    saCurationShortlist: buildSaCurationShortlist(saCandidateRows),
    detentionCentre: detentionRows[0] || null,
    dynamicSamples: {
      orgSlug: adelaideRows.find((row) => row.slug)?.slug || null,
      personSlug: dynamicPersonRows[0]?.slug || null,
      claimId: dynamicClaimRows[0]?.claim_id || null,
    },
    foundation: {
      ...foundation,
      classifiedPct: pct(foundation.classified_rows, foundation.total_foundation_rows),
    },
    oversightByJurisdiction: oversightCoverage.map((row) => ({
      jurisdiction: row.jurisdiction,
      row_count: numberValue(row.recommendation_rows),
    })),
    oversightCoverage,
    oversightRecommendationExtraction: sortOversightCoverage(oversightExtractionRows),
    fundingByState: fundingRows,
    saBudget2025: saBudget2025Rows[0] || { row_count: 0, dollars: 0 },
    plannedSourceBacklog: sourceBacklogRows,
    openGapBacklog: gapRows,
  };
}

function evaluate(results) {
  const blockers = [];
  const warnings = [];

  const missingRouteFiles = results.routes.filter((route) => !route.exists);
  if (missingRouteFiles.length > 0) {
    blockers.push(`${missingRouteFiles.length} civic route file(s) are missing.`);
  }

  if (!results.http.skipped) {
    const failingHttp = results.http.routes.filter((route) => !route.ok);
    const slowPublicRoutes = results.http.routes.filter((route) => route.kind.startsWith('public') && route.ok && route.durationMs > 8000);
    const missingRequiredText = results.http.routes.filter((route) => route.kind.startsWith('public') && route.ok && route.missingText?.length > 0);
    if (failingHttp.some((route) => route.kind.startsWith('public'))) {
      blockers.push(`${failingHttp.length} checked route(s) returned a non-2xx/3xx status.`);
    } else if (failingHttp.length > 0) {
      warnings.push(`${failingHttp.length} operator route(s) returned a non-2xx/3xx status; auth redirects may be expected.`);
    }
    if (slowPublicRoutes.length > 0) {
      warnings.push(`${slowPublicRoutes.length} public route(s) responded slower than 8s: ${slowPublicRoutes.map((route) => route.route).join(', ')}.`);
    }
    if (missingRequiredText.length > 0) {
      blockers.push(`${missingRequiredText.length} checked route(s) are missing required launch caveat text.`);
    }
  } else {
    warnings.push('HTTP route smoke was skipped because no base URL was provided.');
  }

  if (results.db.skipped) {
    warnings.push('Database checks were skipped.');
    return { blockers, warnings };
  }

  if (results.db.error) {
    blockers.push(`Database checks failed: ${results.db.error}`);
    return { blockers, warnings };
  }

  const snapshot = results.db.snapshot;
  const claims = snapshot.claimTraceability;
  const evidence = snapshot.evidence;
  const tier1 = snapshot.tier1;
  const foundation = snapshot.foundation;

  if (numberValue(claims.public_claims_missing_source_docs) > 0) {
    blockers.push(`${claims.public_claims_missing_source_docs} public claim(s) are missing source document URLs.`);
  }

  if (numberValue(evidence.public_claims_without_evidence) > 0) {
    blockers.push(`${evidence.public_claims_without_evidence} public claim(s) have no evidence summary.`);
  }

  if (numberValue(evidence.triangulated_claims) < 50) {
    blockers.push(`Only ${evidence.triangulated_claims} triangulated public claims; launch floor is 50.`);
  }

  if (numberValue(tier1.confirmed_tier1) <= 0) {
    blockers.push('No confirmed Tier 1 organisations are available.');
  }

  if (snapshot.adelaideLocale.count <= 0) {
    blockers.push('The Adelaide locale has no confirmed Tier 1 organisations matched by city.');
  }

  if (!snapshot.detentionCentre) {
    blockers.push('The Adelaide Youth Training Centre detention record is missing.');
  }

  if (numberValue(tier1.sa_confirmed_tier1) < 10) {
    warnings.push(`SA has only ${tier1.sa_confirmed_tier1} confirmed Tier 1 organisations; keep curating before treating the register as complete.`);
    if (snapshot.saCurationShortlist.length > 0) {
      warnings.push(`${snapshot.saCurationShortlist.length} SA Tier 1/ACCO review candidate(s) are listed in the launch report.`);
    }
  }

  if (numberValue(tier1.sa_acco_certified_tier1) === 0) {
    warnings.push('SA has 0 ACCO-certified confirmed Tier 1 organisations; do not imply ACCO coverage from Indigenous-led flags.');
  }

  if (numberValue(foundation.classifiedPct) < 99) {
    warnings.push(`Foundation YJ classifier coverage is ${foundation.classifiedPct}%; PRF and foundation backlog still need approval/run.`);
  }

  const oversightCoverage = snapshot.oversightCoverage || snapshot.oversightByJurisdiction.map((row) => ({
    jurisdiction: row.jurisdiction,
    recommendation_rows: numberValue(row.row_count),
    children_commissioner_reports: 0,
    children_yj_relevant_reports: 0,
    children_detention_reports: 0,
    children_indigenous_overrep_reports: 0,
    auditor_general_audits: 0,
    total_evidence_rows: numberValue(row.row_count),
  }));
  const oversightMap = new Map(oversightCoverage.map((row) => [row.jurisdiction, row]));
  const missingOversightEvidenceStates = STATES.filter((state) => !numberValue(oversightMap.get(state)?.total_evidence_rows));
  if (missingOversightEvidenceStates.length > 0) {
    warnings.push(`No oversight evidence rows across recommendations, Children's Commissioner reports or Auditor-General audits for: ${missingOversightEvidenceStates.join(', ')}.`);
  }

  const missingRecommendationStates = STATES.filter((state) => !numberValue(oversightMap.get(state)?.recommendation_rows));
  if (missingRecommendationStates.length > 0) {
    const evidenceOnlyStates = missingRecommendationStates.filter((state) => numberValue(oversightMap.get(state)?.total_evidence_rows) > 0);
    const extractionMap = new Map((snapshot.oversightRecommendationExtraction || []).map((row) => [row.jurisdiction, row]));
    const extractionCandidates = missingRecommendationStates.reduce(
      (total, state) => total + numberValue(extractionMap.get(state)?.total_candidate_recommendations),
      0
    );
    const extractionNote = extractionCandidates > 0
      ? ` ${extractionCandidates} structured recommendation candidate(s) are ready for source review.`
      : '';
    warnings.push(`No oversight recommendation rows for ${missingRecommendationStates.join(', ')}; ${evidenceOnlyStates.length} of those jurisdiction(s) already have supporting evidence rows and need recommendation extraction.${extractionNote}`);
  }

  const saOversight = oversightMap.get('SA');
  if (
    saOversight &&
    numberValue(saOversight.recommendation_rows) > 0 &&
    numberValue(saOversight.children_commissioner_reports) === 0 &&
    numberValue(saOversight.auditor_general_audits) === 0
  ) {
    warnings.push('SA broader oversight evidence is thin: recommendation rows exist, but children/visitor or Auditor-General evidence rows are missing. Refresh source, report-row and recommendation candidates with scripts/civic/propose-sa-oversight-source-candidates.mjs, scripts/civic/propose-sa-oversight-report-rows.mjs and scripts/civic/propose-sa-oversight-recommendation-candidates.mjs.');
  }

  if (numberValue(snapshot.saBudget2025?.row_count) === 0) {
    warnings.push('SA Budget 2025-26 DHS Youth Justice aggregate is not imported yet. Refresh dry-run candidates with scripts/civic/propose-sa-budget-yj-candidates.mjs.');
  }

  const plannedBacklog = snapshot.plannedSourceBacklog.reduce((total, row) => total + numberValue(row.planned_count), 0);
  if (plannedBacklog > 0) {
    warnings.push(`${plannedBacklog} planned source(s) remain in the inventory backlog. Refresh ranked triage with scripts/civic/report-civic-data-backlog.mjs.`);
  }

  const unresolvedGaps = snapshot.openGapBacklog.reduce((total, row) => total + numberValue(row.open_count), 0);
  if (unresolvedGaps > 0) {
    warnings.push(`${unresolvedGaps} non-closed data gap question(s) remain. Refresh ranked triage with scripts/civic/report-civic-data-backlog.mjs.`);
  }

  return { blockers, warnings };
}

function tableRows(rows, columns) {
  if (rows.length === 0) return '_None._\n';
  const header = `| ${columns.map((column) => column.label).join(' | ')} |`;
  const divider = `| ${columns.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${columns.map((column) => column.format(row)).join(' | ')} |`);
  return [header, divider, ...body].join('\n');
}

function renderMarkdown(results, evaluation) {
  const lines = [];
  const generatedAt = results.generatedAt;
  lines.push('# Civic Launch Readiness Check');
  lines.push('');
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${evaluation.blockers.length === 0 ? 'pass' : 'blocked'}`);
  lines.push('');

  lines.push('## Blockers');
  lines.push('');
  if (evaluation.blockers.length === 0) {
    lines.push('- None.');
  } else {
    for (const blocker of evaluation.blockers) lines.push(`- ${blocker}`);
  }
  lines.push('');

  lines.push('## Warnings');
  lines.push('');
  if (evaluation.warnings.length === 0) {
    lines.push('- None.');
  } else {
    for (const warning of evaluation.warnings) lines.push(`- ${warning}`);
  }
  lines.push('');
  lines.push('Consolidated operator queue: run `node scripts/civic/report-adelaide-launch-action-queue.mjs` to refresh `artifacts/civic-launch-readiness/adelaide-launch-action-queue.md`.');
  lines.push('');

  lines.push('## Route Files');
  lines.push('');
  lines.push(tableRows(results.routes, [
    { label: 'Route', format: (row) => row.route },
    { label: 'Kind', format: (row) => row.kind },
    { label: 'File', format: (row) => row.exists ? 'present' : 'missing' },
  ]));
  lines.push('');

  if (!results.http.skipped) {
    lines.push('## HTTP Smoke');
    lines.push('');
    lines.push(`Base URL: ${results.http.baseUrl}`);
    lines.push('');
    lines.push(tableRows(results.http.routes, [
      { label: 'Route', format: (row) => row.route },
      { label: 'Status', format: (row) => String(row.status || 'unreachable') },
      { label: 'Duration', format: (row) => `${row.durationMs}ms` },
      { label: 'Required text', format: (row) => row.missingText ? (row.missingText.length === 0 ? 'ok' : `missing ${row.missingText.length}`) : 'n/a' },
      { label: 'Result', format: (row) => row.ok && (!row.missingText || row.missingText.length === 0) ? 'ok' : 'fail' },
    ]));
    lines.push('');
  }

  if (!results.db.skipped && !results.db.error) {
    const snapshot = results.db.snapshot;
    const claims = snapshot.claimTraceability;
    const evidence = snapshot.evidence;
    const tier1 = snapshot.tier1;
    const foundation = snapshot.foundation;

    lines.push('## Core Data');
    lines.push('');
    lines.push(tableRows([
      { metric: 'Public claims', value: claims.public_claims },
      { metric: 'Public claims missing source docs', value: claims.public_claims_missing_source_docs },
      { metric: 'Triangulated public claims', value: evidence.triangulated_claims },
      { metric: 'Corroborated public claims', value: evidence.corroborated_claims },
      { metric: 'Public claims without evidence', value: evidence.public_claims_without_evidence },
      { metric: 'Confirmed Tier 1 organisations', value: tier1.confirmed_tier1 },
      { metric: 'SA confirmed Tier 1 organisations', value: tier1.sa_confirmed_tier1 },
      { metric: 'SA ACCO-certified confirmed Tier 1 organisations', value: tier1.sa_acco_certified_tier1 },
      { metric: 'Foundation rows classified', value: `${foundation.classified_rows}/${foundation.total_foundation_rows} (${foundation.classifiedPct}%)` },
      { metric: 'Foundation YJ-relevant rows', value: `${foundation.yj_relevant_rows} (${money(foundation.yj_relevant_dollars)})` },
    ], [
      { label: 'Metric', format: (row) => row.metric },
      { label: 'Value', format: (row) => String(row.value) },
    ]));
    lines.push('');
    lines.push('Foundation classifier backlog artifact: run `node scripts/civic/report-foundation-classifier-backlog.mjs` to refresh `artifacts/civic-launch-readiness/foundation-classifier-backlog.md`.');
    lines.push('');

    lines.push('## Adelaide Locale');
    lines.push('');
    const centre = snapshot.detentionCentre;
    lines.push(`Detention record: ${centre ? `${centre.name} (${centre.slug})` : 'missing'}`);
    lines.push('');
    lines.push(tableRows(snapshot.adelaideLocale.confirmedTier1, [
      { label: 'Organisation', format: (row) => row.name },
      { label: 'City', format: (row) => row.city || '' },
      { label: 'Indigenous-led', format: (row) => row.is_indigenous_org ? 'yes' : 'no' },
      { label: 'ACCO-certified', format: (row) => row.acco_certified ? 'yes' : 'no' },
    ]));
    lines.push('');

    lines.push('## SA Tier 1 Curation Shortlist');
    lines.push('');
    lines.push('These are read-only review candidates generated from existing register, ACCO, funding and beneficiary signals. They are not confirmed Tier 1 rows until accepted in /admin/civic/tier-1-curation.');
    lines.push('');
    lines.push('For a standalone operator review artifact, run `node scripts/civic/propose-sa-tier1-curation-candidates.mjs`; it writes `artifacts/civic-launch-readiness/sa-tier1-curation-candidates.md`.');
    lines.push('');
    lines.push(tableRows(snapshot.saCurationShortlist, [
      { label: 'Score', format: (row) => String(row.score) },
      { label: 'Organisation', format: (row) => row.name },
      { label: 'City', format: (row) => row.city || '' },
      { label: 'ACCO', format: (row) => row.acco_certified ? 'yes' : 'no' },
      { label: 'Indigenous-led', format: (row) => row.is_indigenous_org ? 'yes' : 'no' },
      { label: 'Justice funding', format: (row) => money(row.justice_funding) },
      { label: 'Signals', format: (row) => row.signals.join('; ') },
    ]));
    lines.push('');

    lines.push('## Oversight Coverage');
    lines.push('');
    const oversightCoverage = snapshot.oversightCoverage || snapshot.oversightByJurisdiction.map((row) => ({
      jurisdiction: row.jurisdiction,
      recommendation_rows: row.row_count,
      children_commissioner_reports: 0,
      children_yj_relevant_reports: 0,
      children_detention_reports: 0,
      children_indigenous_overrep_reports: 0,
      auditor_general_audits: 0,
      total_evidence_rows: row.row_count,
    }));
    const extractionMap = new Map((snapshot.oversightRecommendationExtraction || []).map((row) => [row.jurisdiction, row]));
    lines.push(tableRows(oversightCoverage, [
      { label: 'Jurisdiction', format: (row) => row.jurisdiction || 'unknown' },
      { label: 'Recommendations', format: (row) => String(numberValue(row.recommendation_rows)) },
      { label: 'Children reports', format: (row) => `${numberValue(row.children_commissioner_reports)} (${numberValue(row.children_yj_relevant_reports)} YJ)` },
      { label: 'Auditor audits', format: (row) => String(numberValue(row.auditor_general_audits)) },
      { label: 'Evidence rows', format: (row) => String(numberValue(row.total_evidence_rows)) },
      { label: 'Status', format: (row) => oversightLaunchStatus(row) },
    ]));
    lines.push('');

    lines.push('## Oversight Source Plan');
    lines.push('');
    lines.push('Standalone SA oversight source artifact: run `node scripts/civic/propose-sa-oversight-source-candidates.mjs` to refresh `artifacts/civic-launch-readiness/sa-oversight-source-candidates.md`.');
    lines.push('Standalone SA oversight report-row artifact: run `node scripts/civic/propose-sa-oversight-report-rows.mjs --only priority1` to refresh `artifacts/civic-launch-readiness/sa-oversight-report-rows.md`.');
    lines.push('Standalone SA oversight recommendation artifact: run `node scripts/civic/propose-sa-oversight-recommendation-candidates.mjs` to refresh `artifacts/civic-launch-readiness/sa-oversight-recommendation-candidates.md`.');
    lines.push('');
    lines.push(tableRows(oversightCoverage.filter((row) => STATES.includes(row.jurisdiction)), [
      { label: 'Jurisdiction', format: (row) => row.jurisdiction },
      { label: 'Candidate recs', format: (row) => String(numberValue(extractionMap.get(row.jurisdiction)?.total_candidate_recommendations)) },
      { label: 'Next step', format: (row) => oversightNextStep(row) },
    ]));
    lines.push('');

    lines.push('## Funding Coverage');
    lines.push('');
    lines.push(`SA Budget 2025-26 DHS Youth Justice rows: ${numberValue(snapshot.saBudget2025?.row_count)} (${money(snapshot.saBudget2025?.dollars)}).`);
    lines.push('');
    lines.push('Standalone SA budget candidate artifact: run `node scripts/civic/propose-sa-budget-yj-candidates.mjs` to refresh `artifacts/civic-launch-readiness/sa-budget-yj-candidates.md`.');
    lines.push('');
    lines.push(tableRows(snapshot.fundingByState, [
      { label: 'State', format: (row) => row.state },
      { label: 'Rows', format: (row) => String(row.row_count) },
      { label: 'Dollars', format: (row) => money(row.dollars) },
    ]));
    lines.push('');

    lines.push('## Source Backlog');
    lines.push('');
    lines.push('Standalone launch backlog artifact: run `node scripts/civic/report-civic-data-backlog.mjs` to refresh `artifacts/civic-launch-readiness/data-backlog.md`.');
    lines.push('');
    lines.push(tableRows(snapshot.plannedSourceBacklog, [
      { label: 'Topic', format: (row) => row.topic || 'unknown' },
      { label: 'Planned sources', format: (row) => String(row.planned_count) },
    ]));
    lines.push('');

    lines.push('## Open Data Gaps');
    lines.push('');
    lines.push('Counts include every non-closed row, including `open`, `investigating` and `sourced` gaps that still need closure.');
    lines.push('');
    lines.push(tableRows(snapshot.openGapBacklog, [
      { label: 'Topic', format: (row) => row.topic || 'unknown' },
      { label: 'Priority', format: (row) => row.priority || 'unknown' },
      { label: 'Open gaps', format: (row) => String(row.open_count) },
    ]));
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

async function writeOutputs(outputDir, results, evaluation) {
  await fs.mkdir(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, 'latest.json');
  const mdPath = path.join(outputDir, 'latest.md');
  await fs.writeFile(jsonPath, `${JSON.stringify({ ...results, evaluation }, null, 2)}\n`);
  await fs.writeFile(mdPath, renderMarkdown(results, evaluation));
  return { jsonPath, mdPath };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const results = {
    generatedAt: new Date().toISOString(),
    routes: await resolveRouteFiles(),
    db: { skipped: args.skipDb },
  };

  if (!args.skipDb) {
    const candidates = getConnectionCandidates();
    if (candidates.length === 0) {
      results.db = {
        skipped: false,
        error: 'Missing DB connection env. Set SUPABASE_CONNECTION_STRING, DATABASE_URL, SUPABASE_DB_URL, or SUPABASE_DATABASE_URL.',
      };
    } else {
      const errors = [];
      for (const candidate of candidates) {
        const client = new Client({ connectionString: candidate.connectionString });
        try {
          // eslint-disable-next-line no-await-in-loop
          await client.connect();
          // eslint-disable-next-line no-await-in-loop
          const snapshot = await readDatabaseSnapshot(client);
          results.db = {
            skipped: false,
            connectionEnv: candidate.name,
            snapshot,
          };
          break;
        } catch (error) {
          errors.push(`${candidate.name}: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
          // eslint-disable-next-line no-await-in-loop
          await client.end().catch(() => {});
        }
      }

      if (!results.db.snapshot) {
        const apiConfig = getSupabaseApiConfig();
        if (apiConfig) {
          try {
            const supabase = createClient(apiConfig.url, apiConfig.serviceRoleKey, {
              auth: {
                persistSession: false,
                autoRefreshToken: false,
              },
            });
            results.db = {
              skipped: false,
              connectionEnv: 'SUPABASE_SERVICE_ROLE_KEY Data API',
              directConnectionErrors: errors,
              snapshot: await readDatabaseSnapshotFromSupabaseApi(supabase),
            };
          } catch (error) {
            results.db = {
              skipped: false,
              error: `${errors.join('; ')}; Data API fallback: ${error instanceof Error ? error.message : String(error)}`,
            };
          }
        } else {
          results.db = {
            skipped: false,
            error: errors.join('; '),
          };
        }
      }
    }
  }

  results.http = args.skipHttp
    ? { skipped: true, routes: [] }
    : await httpRouteChecks(args.baseUrl, buildDynamicSmokeRoutes(results.db.snapshot));

  const evaluation = evaluate(results);
  const outputs = await writeOutputs(args.outputDir, results, evaluation);
  const failed = evaluation.blockers.length > 0 || (args.strictWarnings && evaluation.warnings.length > 0);

  console.log('Civic launch readiness check');
  console.log(`- Status: ${failed ? 'blocked' : 'pass'}`);
  console.log(`- Blockers: ${evaluation.blockers.length}`);
  console.log(`- Warnings: ${evaluation.warnings.length}`);
  console.log(`- Report: ${path.relative(PROJECT_ROOT, outputs.mdPath)}`);
  console.log(`- JSON: ${path.relative(PROJECT_ROOT, outputs.jsonPath)}`);

  if (evaluation.blockers.length > 0) {
    console.log('');
    console.log('Blockers:');
    for (const blocker of evaluation.blockers) console.log(`- ${blocker}`);
  }

  if (evaluation.warnings.length > 0) {
    console.log('');
    console.log('Warnings:');
    for (const warning of evaluation.warnings) console.log(`- ${warning}`);
  }

  process.exitCode = failed ? 1 : 0;
}

main().catch((error) => {
  console.error('Civic launch readiness check crashed:', error);
  process.exit(1);
});
