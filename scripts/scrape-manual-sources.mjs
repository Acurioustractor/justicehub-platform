#!/usr/bin/env node
/**
 * scrape-manual-sources.mjs
 *
 * Downloads data from Australian government sources that don't have proper APIs
 * but DO have downloadable files (Excel, CSV, web pages).
 *
 * Usage:
 *   node scripts/scrape-manual-sources.mjs aihw-yj         # AIHW Youth Justice
 *   node scripts/scrape-manual-sources.mjs aihw-cp         # AIHW Child Protection
 *   node scripts/scrape-manual-sources.mjs bocsar          # NSW BOCSAR reoffending
 *   node scripts/scrape-manual-sources.mjs rogs            # Productivity Commission ROGS
 *   node scripts/scrape-manual-sources.mjs grantconnect    # GrantConnect grants
 *   node scripts/scrape-manual-sources.mjs all             # All sources
 *
 * Flags:
 *   --dry-run  (default) Preview what would be inserted
 *   --apply    Actually insert into database
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Setup
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const envFile = readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const SLEEP = (ms) => new Promise(r => setTimeout(r, ms));
const UA = 'JusticeHub-Research/1.0 (manual-sources-scraper)';

// Parse CLI args
const positionalArgs = process.argv.slice(2).filter(a => !a.startsWith('--'));
const source = positionalArgs[0] || 'all';
const DRY_RUN = !process.argv.includes('--apply');

// Cache directory for downloaded files
const CACHE_DIR = '.cache/manual-sources';
if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Utility functions (mirrored from src/lib/scraping/manual-sources-utils.ts)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function contentHashFn(title, sourceUrl) {
  return createHash('sha256')
    .update(`${title}|${sourceUrl}`)
    .digest('hex')
    .substring(0, 16);
}

function extractDownloadLinks(html, baseUrl, extensions = ['.xlsx', '.xls', '.csv', '.zip']) {
  const links = [];
  const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    const labelRaw = match[2].replace(/<[^>]+>/g, '').trim();
    const lowerHref = href.toLowerCase();
    if (extensions.some(ext => lowerHref.endsWith(ext))) {
      const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).toString();
      links.push({ url: fullUrl, label: labelRaw || fullUrl.split('/').pop() || 'unknown' });
    }
  }
  return links;
}

function parseFundingAmount(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function buildFinding(title, sourceUrl, data, sourceName) {
  return {
    finding_type: 'external_source',
    content: {
      title: title.substring(0, 500),
      source: sourceName,
      hash: contentHashFn(title, sourceUrl),
      ...data,
    },
    sources: [sourceUrl],
    confidence: 0.85,
    validated: true,
    validation_source: 'manual_sources_scraper',
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Shared helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function fetchPage(url, label) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.log(`  [SKIP] ${label} -- HTTP ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (e) {
    console.log(`  [ERROR] ${label}: ${e.message}`);
    return null;
  }
}

async function fetchJSON(url, label) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.log(`  [SKIP] ${label} -- HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.log(`  [ERROR] ${label}: ${e.message}`);
    return null;
  }
}

/** Insert a finding with dedup via content hash */
async function insertFinding(title, sourceUrl, data, sourceName) {
  const record = buildFinding(title, sourceUrl, data, sourceName);
  const hash = record.content.hash;

  // Check for existing finding with same hash
  const { data: existing } = await supabase
    .from('alma_research_findings')
    .select('id', { count: 'exact', head: true })
    .eq('content->>hash', hash);

  if (existing && existing.length > 0) {
    return { inserted: false, reason: 'duplicate' };
  }

  // Also check by title dedup
  const { count } = await supabase
    .from('alma_research_findings')
    .select('*', { count: 'exact', head: true })
    .eq('content->>title', record.content.title);

  if (count > 0) {
    return { inserted: false, reason: 'duplicate_title' };
  }

  if (DRY_RUN) {
    return { inserted: true, reason: 'dry_run', record };
  }

  const { error } = await supabase.from('alma_research_findings').insert(record);
  if (error && error.code !== '23505') {
    console.log(`  [WARN] ${error.message}`);
    return { inserted: false, reason: error.message };
  }
  return { inserted: !error, reason: error ? 'conflict' : 'ok' };
}

/** Insert a funding record with dedup */
async function insertFundingRecord(record) {
  const { count } = await supabase
    .from('justice_funding')
    .select('*', { count: 'exact', head: true })
    .eq('source', record.source)
    .eq('source_statement_id', record.source_statement_id);

  if (count > 0) {
    return { inserted: false, reason: 'duplicate' };
  }

  if (DRY_RUN) {
    return { inserted: true, reason: 'dry_run', record };
  }

  const { error } = await supabase.from('justice_funding').insert(record);
  if (error) {
    console.log(`  [WARN] ${error.message}`);
    return { inserted: false, reason: error.message };
  }
  return { inserted: true, reason: 'ok' };
}

/** Look up an organization by name or ABN */
async function findOrg(name, abn) {
  if (abn) {
    const { data } = await supabase
      .from('organizations')
      .select('id, name, abn')
      .eq('abn', abn.replace(/\s/g, ''))
      .limit(1);
    if (data?.length) return data[0];
  }
  if (name) {
    const { data } = await supabase
      .from('organizations')
      .select('id, name, abn')
      .ilike('name', `%${name}%`)
      .limit(3);
    if (data?.length === 1) return data[0];
  }
  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SOURCE 1: AIHW Youth Justice
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeAIHWYouthJustice() {
  console.log('\n== AIHW Youth Justice ==');

  const stats = { found: 0, new: 0, existing: 0 };
  const dataPageUrl = 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia/data';
  const altUrl = 'https://www.aihw.gov.au/reports-data/health-welfare-services/youth-justice';

  // Known data table URLs (these change yearly)
  const knownTables = [
    { url: 'https://www.aihw.gov.au/getmedia/youth-justice-data-tables.xlsx', label: 'Youth justice national data tables' },
  ];

  // Fetch the data page and look for download links
  const html = await fetchPage(dataPageUrl, 'AIHW YJ data page');
  if (html) {
    const links = extractDownloadLinks(html, 'https://www.aihw.gov.au');
    console.log(`  Data page: found ${links.length} downloadable files`);
    stats.found += links.length;

    for (const link of links) {
      const result = await insertFinding(
        `AIHW Youth Justice: ${link.label}`,
        link.url,
        {
          dataset: 'youth_justice',
          description: `AIHW youth justice data table: ${link.label}`,
          download_url: link.url,
          data_page: dataPageUrl,
        },
        'AIHW'
      );
      if (result.inserted) stats.new++;
      else stats.existing++;
      await SLEEP(200);
    }
  }

  // Also fetch the alternative/overview page
  const altHtml = await fetchPage(altUrl, 'AIHW YJ overview page');
  if (altHtml) {
    const altLinks = extractDownloadLinks(altHtml, 'https://www.aihw.gov.au');
    console.log(`  Overview page: found ${altLinks.length} downloadable files`);
    stats.found += altLinks.length;

    for (const link of altLinks) {
      const result = await insertFinding(
        `AIHW Youth Justice Overview: ${link.label}`,
        link.url,
        {
          dataset: 'youth_justice_overview',
          description: `AIHW youth justice overview data: ${link.label}`,
          download_url: link.url,
          data_page: altUrl,
        },
        'AIHW'
      );
      if (result.inserted) stats.new++;
      else stats.existing++;
      await SLEEP(200);
    }
  }

  // Try AIHW GEN data
  const genUrl = 'https://www.aihw.gov.au/reports-data/health-welfare-services/child-protection/overview';
  const genHtml = await fetchPage(genUrl, 'AIHW GEN overview');
  if (genHtml) {
    const genLinks = extractDownloadLinks(genHtml, 'https://www.aihw.gov.au');
    if (genLinks.length > 0) {
      console.log(`  GEN page: found ${genLinks.length} downloadable files`);
      stats.found += genLinks.length;
      for (const link of genLinks) {
        const result = await insertFinding(
          `AIHW GEN: ${link.label}`,
          link.url,
          {
            dataset: 'gen_child_welfare',
            description: `AIHW GEN data: ${link.label}`,
            download_url: link.url,
          },
          'AIHW'
        );
        if (result.inserted) stats.new++;
        else stats.existing++;
        await SLEEP(200);
      }
    }
  }

  // Try known supplementary data table URLs
  for (const kt of knownTables) {
    const headRes = await fetch(kt.url, {
      method: 'HEAD',
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(10000),
    }).catch(() => null);

    if (headRes?.ok) {
      stats.found++;
      const result = await insertFinding(
        `AIHW Youth Justice Known Table: ${kt.label}`,
        kt.url,
        {
          dataset: 'youth_justice_supplementary',
          description: kt.label,
          download_url: kt.url,
          verified: true,
        },
        'AIHW'
      );
      if (result.inserted) stats.new++;
      else stats.existing++;
    }
  }

  console.log(`  Result: Found ${stats.found} data tables, ${stats.new} new, ${stats.existing} already existed`);
  return stats;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SOURCE 2: AIHW Child Protection
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeAIHWChildProtection() {
  console.log('\n== AIHW Child Protection ==');

  const stats = { found: 0, new: 0, existing: 0 };
  const dataPageUrl = 'https://www.aihw.gov.au/reports/child-protection/child-protection-australia/data';

  const html = await fetchPage(dataPageUrl, 'AIHW CP data page');
  if (html) {
    const links = extractDownloadLinks(html, 'https://www.aihw.gov.au');
    console.log(`  Data page: found ${links.length} downloadable files`);
    stats.found += links.length;

    for (const link of links) {
      // Categorize by label keywords
      let category = 'general';
      const lower = link.label.toLowerCase();
      if (lower.includes('notification')) category = 'notifications';
      else if (lower.includes('investigation') || lower.includes('substantiation')) category = 'investigations';
      else if (lower.includes('out-of-home') || lower.includes('oohc')) category = 'out_of_home_care';
      else if (lower.includes('indigenous') || lower.includes('aboriginal')) category = 'indigenous_overrepresentation';
      else if (lower.includes('crossover')) category = 'crossover_children';

      const result = await insertFinding(
        `AIHW Child Protection: ${link.label}`,
        link.url,
        {
          dataset: 'child_protection',
          category,
          description: `AIHW child protection data table: ${link.label}`,
          download_url: link.url,
          data_page: dataPageUrl,
        },
        'AIHW'
      );
      if (result.inserted) stats.new++;
      else stats.existing++;
      await SLEEP(200);
    }
  }

  // Also check the AIHW CP contents/related pages
  const relatedUrls = [
    'https://www.aihw.gov.au/reports/child-protection/child-protection-australia/contents/about',
    'https://www.aihw.gov.au/reports/child-protection/child-protection-australia/contents/data-tables',
  ];
  for (const url of relatedUrls) {
    const relHtml = await fetchPage(url, `AIHW CP related: ${url.split('/').pop()}`);
    if (relHtml) {
      const relLinks = extractDownloadLinks(relHtml, 'https://www.aihw.gov.au');
      if (relLinks.length > 0) {
        console.log(`  Related page: found ${relLinks.length} downloadable files`);
        stats.found += relLinks.length;
        for (const link of relLinks) {
          const result = await insertFinding(
            `AIHW Child Protection Related: ${link.label}`,
            link.url,
            {
              dataset: 'child_protection_supplementary',
              description: link.label,
              download_url: link.url,
            },
            'AIHW'
          );
          if (result.inserted) stats.new++;
          else stats.existing++;
          await SLEEP(200);
        }
      }
    }
  }

  console.log(`  Result: Found ${stats.found} data tables, ${stats.new} new, ${stats.existing} already existed`);
  return stats;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SOURCE 3: BOCSAR Reoffending (NSW)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeBOCSAR() {
  console.log('\n== NSW BOCSAR Reoffending ==');

  const stats = { found: 0, new: 0, existing: 0 };

  const urls = [
    { url: 'https://bocsar.nsw.gov.au/topic-areas/re-offending.html', label: 'Reoffending topic page' },
    { url: 'https://www.bocsar.nsw.gov.au/Pages/bocsar_datasets/Datasets-.aspx', label: 'Datasets index' },
    { url: 'https://www.bocsar.nsw.gov.au/Pages/bocsar_crime_stats/bocsar_datasets.aspx', label: 'Crime stats datasets' },
  ];

  for (const page of urls) {
    const html = await fetchPage(page.url, page.label);
    if (!html) continue;

    // BOCSAR uses xlsx and csv for data downloads
    const links = extractDownloadLinks(html, page.url, ['.xlsx', '.xls', '.csv', '.zip']);
    console.log(`  ${page.label}: found ${links.length} downloadable files`);
    stats.found += links.length;

    for (const link of links) {
      let category = 'general';
      const lower = link.label.toLowerCase();
      if (lower.includes('reoffend')) category = 'reoffending';
      else if (lower.includes('juvenile') || lower.includes('youth')) category = 'juvenile';
      else if (lower.includes('court')) category = 'court_outcomes';
      else if (lower.includes('bail')) category = 'bail';
      else if (lower.includes('custody') || lower.includes('prison')) category = 'custody';

      const result = await insertFinding(
        `BOCSAR NSW: ${link.label}`,
        link.url,
        {
          dataset: 'bocsar',
          category,
          state: 'NSW',
          description: `BOCSAR data: ${link.label}`,
          download_url: link.url,
          data_page: page.url,
        },
        'BOCSAR'
      );
      if (result.inserted) stats.new++;
      else stats.existing++;
      await SLEEP(200);
    }

    // Also look for PDF research reports (BOCSAR publishes these regularly)
    const pdfLinks = extractDownloadLinks(html, page.url, ['.pdf']);
    if (pdfLinks.length > 0) {
      console.log(`  ${page.label}: found ${pdfLinks.length} research PDFs`);
      for (const link of pdfLinks) {
        // Only store reoffending/youth-related PDFs
        const lower = link.label.toLowerCase();
        if (lower.includes('reoffend') || lower.includes('juvenile') || lower.includes('youth') || lower.includes('young')) {
          stats.found++;
          const result = await insertFinding(
            `BOCSAR Research: ${link.label}`,
            link.url,
            {
              dataset: 'bocsar_research',
              category: 'research_report',
              state: 'NSW',
              description: `BOCSAR research report: ${link.label}`,
              download_url: link.url,
            },
            'BOCSAR'
          );
          if (result.inserted) stats.new++;
          else stats.existing++;
          await SLEEP(200);
        }
      }
    }
  }

  console.log(`  Result: Found ${stats.found} datasets/reports, ${stats.new} new, ${stats.existing} already existed`);
  return stats;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SOURCE 4: ROGS Data (Productivity Commission)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeROGS() {
  console.log('\n== Productivity Commission ROGS ==');

  const stats = { found: 0, new: 0, existing: 0 };

  // Check existing ROGS data count
  const { count: existingCount } = await supabase
    .from('rogs_justice_spending')
    .select('*', { count: 'exact', head: true });
  console.log(`  Existing rogs_justice_spending rows: ${existingCount}`);

  const rogsUrls = [
    {
      url: 'https://www.pc.gov.au/ongoing/report-on-government-services/2026/community-services/youth-justice',
      label: 'ROGS 2026 Youth Justice chapter',
    },
    {
      url: 'https://www.pc.gov.au/ongoing/report-on-government-services/2026',
      label: 'ROGS 2026 main page',
    },
  ];

  // Known data table URL patterns
  const knownDataTables = [
    'https://www.pc.gov.au/ongoing/report-on-government-services/2026/community-services/youth-justice/rogs-2026-partf-section17-youth-justice-data-tables.xlsx',
    'https://www.pc.gov.au/ongoing/report-on-government-services/2026/community-services/youth-justice/rogs-2026-partf-section17-youth-justice-data-tables.csv',
  ];

  // Try known URLs first
  for (const tableUrl of knownDataTables) {
    const headRes = await fetch(tableUrl, {
      method: 'HEAD',
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(10000),
    }).catch(() => null);

    if (headRes?.ok) {
      stats.found++;
      console.log(`  Found known data table: ${tableUrl.split('/').pop()}`);
      const result = await insertFinding(
        `ROGS 2026 Youth Justice Data Tables: ${tableUrl.split('/').pop()}`,
        tableUrl,
        {
          dataset: 'rogs_2026',
          description: 'Productivity Commission ROGS 2026 youth justice data tables',
          download_url: tableUrl,
          existing_rows: existingCount,
          note: `Already have ${existingCount} rows in rogs_justice_spending -- metadata record only`,
        },
        'Productivity Commission'
      );
      if (result.inserted) stats.new++;
      else stats.existing++;
    }
  }

  // Scrape the chapter pages for additional downloads
  for (const page of rogsUrls) {
    const html = await fetchPage(page.url, page.label);
    if (!html) continue;

    const links = extractDownloadLinks(html, 'https://www.pc.gov.au', ['.xlsx', '.xls', '.csv', '.zip']);
    console.log(`  ${page.label}: found ${links.length} downloadable files`);

    for (const link of links) {
      stats.found++;
      // Check if this is a youth justice table we haven't seen
      const lower = link.label.toLowerCase() + link.url.toLowerCase();
      const isYJ = lower.includes('youth') || lower.includes('justice') || lower.includes('section17') || lower.includes('partf');

      const result = await insertFinding(
        `ROGS 2026: ${link.label}`,
        link.url,
        {
          dataset: 'rogs_2026',
          is_youth_justice: isYJ,
          description: `ROGS data file: ${link.label}`,
          download_url: link.url,
          data_page: page.url,
          existing_rogs_rows: existingCount,
        },
        'Productivity Commission'
      );
      if (result.inserted) stats.new++;
      else stats.existing++;
      await SLEEP(200);
    }
  }

  console.log(`  Result: Found ${stats.found} data files, ${stats.new} new (already have ${existingCount} rows imported)`);
  return stats;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SOURCE 5: GrantConnect
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeGrantConnect() {
  console.log('\n== GrantConnect (via data.gov.au) ==');

  const stats = { found: 0, new_findings: 0, new_funding: 0, linked_orgs: 0, existing: 0 };

  // Search data.gov.au for GrantConnect datasets
  const searchQueries = [
    'grantconnect+youth+justice',
    'grantconnect+community+services',
    'grantconnect+indigenous+justice',
    'grants+youth+justice+australia',
  ];

  const seenPackageIds = new Set();

  for (const query of searchQueries) {
    const url = `https://data.gov.au/data/api/3/action/package_search?q=${query}&rows=20`;
    const data = await fetchJSON(url, `data.gov.au: ${query}`);
    if (!data?.result?.results) continue;

    const results = data.result.results;
    console.log(`  Query "${query}": ${results.length} packages`);

    for (const pkg of results) {
      if (seenPackageIds.has(pkg.id)) continue;
      seenPackageIds.add(pkg.id);
      stats.found++;

      // Store as research finding
      const csvResources = (pkg.resources || []).filter(r =>
        ['CSV', 'XLSX', 'XLS'].includes((r.format || '').toUpperCase())
      );

      const result = await insertFinding(
        `GrantConnect data.gov.au: ${pkg.title}`,
        `https://data.gov.au/dataset/${pkg.name || pkg.id}`,
        {
          dataset: 'grantconnect',
          description: (pkg.notes || '').substring(0, 500),
          organization: pkg.organization?.title,
          resources: csvResources.map(r => ({
            name: r.name,
            url: r.url,
            format: r.format,
          })),
          resource_count: csvResources.length,
          tags: (pkg.tags || []).map(t => t.name),
        },
        'GrantConnect'
      );
      if (result.inserted) stats.new_findings++;
      else stats.existing++;

      // If CSV resources exist, try to fetch and extract grant records
      for (const resource of csvResources.slice(0, 3)) {
        if (!resource.url) continue;
        try {
          const csvRes = await fetch(resource.url, {
            headers: { 'User-Agent': UA },
            signal: AbortSignal.timeout(15000),
          });
          if (!csvRes.ok) continue;

          const csvText = await csvRes.text();
          // Only try parsing if it looks like CSV
          if (!csvText.includes(',') || csvText.length < 50) continue;

          const { parse } = await import('csv-parse/sync');
          const rows = parse(csvText, {
            columns: true,
            skip_empty_lines: true,
            relax_column_count: true,
            relax_quotes: true,
            trim: true,
          });

          console.log(`    CSV ${resource.name}: ${rows.length} rows`);

          // Look for grant-like records (with recipient, amount, etc.)
          for (const row of rows.slice(0, 50)) {
            const recipientName = row['Recipient'] || row['Organisation'] || row['Grantee'] || row['recipient_name'];
            const amountStr = row['Amount'] || row['Value'] || row['Grant Amount'] || row['amount'];
            const amount = parseFundingAmount(amountStr);
            const grantTitle = row['Title'] || row['Grant Title'] || row['Program'] || row['grant_title'];
            const abn = row['ABN'] || row['abn'];

            if (!recipientName && !grantTitle) continue;

            // Try to link to existing organization
            const org = await findOrg(recipientName, abn);
            if (org) stats.linked_orgs++;

            if (amount && grantTitle) {
              const fundingResult = await insertFundingRecord({
                source: 'grantconnect',
                source_statement_id: contentHashFn(`${grantTitle}|${recipientName}|${amount}`, resource.url),
                title: grantTitle,
                amount,
                recipient_name: recipientName,
                recipient_abn: abn || null,
                organization_id: org?.id || null,
                funding_year: row['Year'] || row['Financial Year'] || null,
                description: row['Description'] || row['Purpose'] || null,
              });
              if (fundingResult.inserted) stats.new_funding++;
            }
          }
        } catch (e) {
          console.log(`    [WARN] CSV parse error: ${e.message}`);
        }
        await SLEEP(500);
      }

      await SLEEP(300);
    }
  }

  // Also try direct GrantConnect search
  const gcUrl = 'https://www.grants.gov.au/';
  const gcHtml = await fetchPage(gcUrl, 'GrantConnect homepage');
  if (gcHtml) {
    // Check for RSS/data feeds
    const feedLinks = extractDownloadLinks(gcHtml, gcUrl, ['.xml', '.rss', '.csv', '.xlsx']);
    if (feedLinks.length > 0) {
      console.log(`  GrantConnect homepage: found ${feedLinks.length} data feeds`);
      for (const link of feedLinks) {
        stats.found++;
        const result = await insertFinding(
          `GrantConnect Direct: ${link.label}`,
          link.url,
          { dataset: 'grantconnect_direct', download_url: link.url },
          'GrantConnect'
        );
        if (result.inserted) stats.new_findings++;
        else stats.existing++;
      }
    }
  }

  console.log(`  Result: Found ${stats.found} justice-related packages on data.gov.au`);
  console.log(`    ${stats.new_findings} new research findings`);
  console.log(`    ${stats.new_funding} new funding records linked to ${stats.linked_orgs} orgs`);
  return stats;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main runner
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SOURCES = {
  'aihw-yj': { fn: scrapeAIHWYouthJustice, label: 'AIHW Youth Justice' },
  'aihw-cp': { fn: scrapeAIHWChildProtection, label: 'AIHW Child Protection' },
  'bocsar': { fn: scrapeBOCSAR, label: 'NSW BOCSAR Reoffending' },
  'rogs': { fn: scrapeROGS, label: 'Productivity Commission ROGS' },
  'grantconnect': { fn: scrapeGrantConnect, label: 'GrantConnect' },
};

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Manual Sources Scraper`);
  console.log(`  Source: ${source}`);
  console.log(`  Mode:   ${DRY_RUN ? 'DRY RUN (use --apply to insert)' : 'APPLY (writing to database)'}`);
  console.log(`${'='.repeat(60)}`);

  const results = {};

  if (source === 'all') {
    for (const [key, { fn, label }] of Object.entries(SOURCES)) {
      try {
        results[key] = await fn();
      } catch (e) {
        console.log(`\n  [FATAL] ${label}: ${e.message}`);
        results[key] = { error: e.message };
      }
    }
  } else if (SOURCES[source]) {
    try {
      results[source] = await SOURCES[source].fn();
    } catch (e) {
      console.log(`\n  [FATAL] ${SOURCES[source].label}: ${e.message}`);
      results[source] = { error: e.message };
    }
  } else {
    console.error(`\nUnknown source: "${source}"`);
    console.error(`Available: ${Object.keys(SOURCES).join(', ')}, all`);
    process.exit(1);
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('  Summary');
  console.log(`${'='.repeat(60)}`);
  for (const [key, stats] of Object.entries(results)) {
    const label = SOURCES[key]?.label || key;
    if (stats.error) {
      console.log(`  ${label}: ERROR -- ${stats.error}`);
    } else if (stats.new_findings !== undefined) {
      // GrantConnect format
      console.log(`  ${label}: Found ${stats.found} packages, ${stats.new_findings} new findings, ${stats.new_funding} new funding records`);
    } else {
      console.log(`  ${label}: Found ${stats.found} data tables, ${stats.new} new, ${stats.existing} already existed`);
    }
  }

  if (DRY_RUN) {
    console.log(`\n  ** DRY RUN ** -- No data was written. Use --apply to insert.`);
  }
  console.log('');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
