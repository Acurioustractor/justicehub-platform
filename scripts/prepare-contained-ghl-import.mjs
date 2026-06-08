#!/usr/bin/env node

/**
 * Prepare CONTAINED Adelaide campaign records for GoHighLevel review/import.
 *
 * This script is intentionally file-only: it does not call or mutate GHL,
 * Notion, Gmail, or Supabase. It turns the audited CRM export into import
 * CSVs and creates discovery seed lists from local GrantScope sources.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'output', 'ghl-contained-adelaide-audit');
const SEGMENTS_PATH = path.join(OUT_DIR, 'segments.json');
const GRANTSCOPE_ROOT = '/Users/benknight/Code/grantscope';

const PIPELINE_NAME = 'CONTAINED Adelaide 2026';

const OUTPUTS = {
  importCsv: path.join(OUT_DIR, 'contained-ghl-import.csv'),
  personalCsv: path.join(OUT_DIR, 'contained-personal-outreach.csv'),
  warmCsv: path.join(OUT_DIR, 'contained-warm-group.csv'),
  discoveryCsv: path.join(OUT_DIR, 'contained-discovery-seeds.csv'),
  tagActionsCsv: path.join(OUT_DIR, 'contained-ghl-tag-actions.csv'),
  strategyMd: path.join(OUT_DIR, 'contained-ghl-strategy.md'),
  manifestJson: path.join(OUT_DIR, 'contained-agent-manifest.json'),
};

const DISCOVERY_SOURCES = [
  {
    id: 'sasec-members',
    label: 'SA Social Enterprise Council members',
    path: path.join(GRANTSCOPE_ROOT, 'data', 'scrapes', 'sasec-loadmembers.json'),
    defaultState: 'SA',
    defaultLocation: 'South Australia',
    defaultTags: ['source:grantscope', 'source:sasec', 'place:sa', 'role:social-enterprise'],
  },
  {
    id: 'secna-directory',
    label: 'Social Enterprise Council network directory',
    path: path.join(GRANTSCOPE_ROOT, 'data', 'scrapes', 'secna-embeddirectory.json'),
    defaultState: '',
    defaultLocation: '',
    defaultTags: ['source:grantscope', 'source:secna', 'role:social-enterprise'],
  },
  {
    id: 'supply-nation-sa',
    label: 'Supply Nation businesses servicing SA',
    path: path.join(GRANTSCOPE_ROOT, 'data', 'supply-nation', 'supply_nation_businesses.json'),
    defaultState: 'SA',
    defaultLocation: 'South Australia',
    defaultTags: ['source:grantscope', 'source:supply-nation', 'place:sa', 'audience:first-nations'],
  },
];

const CODEBASE_ALIGNMENT = [
  ['Campaign content and tour stops', 'src/content/campaign.ts'],
  ['Newsletter sequences', 'src/content/newsletter-sequences.ts'],
  ['GHL client wrapper', 'src/lib/ghl/client.ts'],
  ['Campaign pipeline stages', 'src/lib/campaign/pipeline-stages.ts'],
  ['Admin CRM surface', 'src/app/admin/contained/crm/page.tsx'],
  ['Admin campaign engine APIs', 'src/app/api/admin/campaign-alignment'],
  ['GHL newsletter endpoint', 'src/app/api/ghl/newsletter/route.ts'],
  ['GHL signup/register endpoints', 'src/app/api/ghl/signup/route.ts and src/app/api/ghl/register/route.ts'],
  ['CONTAINED nurture cron', 'src/app/api/cron/contained/nurture/route.ts'],
  ['CONTAINED post-experience cron', 'src/app/api/cron/contained/post-experience/route.ts'],
  ['Current audited GHL export', 'scripts/export-contained-adelaide-ghl-segments.mjs'],
  ['GrantScope-to-GHL sync pattern', 'scripts/sync-allies-to-ghl.mjs'],
  ['LinkedIn campaign scrape pattern', 'scripts/scrape-linkedin-engagement.mjs'],
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function maybeReadJson(filePath) {
  try {
    return readJson(filePath);
  } catch {
    return null;
  }
}

function ensureOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function clean(value) {
  return String(value ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function csvEscape(value) {
  const text = clean(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(filePath, rows, columns) {
  const body = [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(',')),
  ].join('\n');
  fs.writeFileSync(filePath, `${body}\n`);
}

function splitTags(tags) {
  return String(tags || '')
    .split(/[;,]/)
    .map((tag) => clean(tag).toLowerCase())
    .filter(Boolean);
}

function hasAnyTag(tags, needles) {
  return needles.some((needle) => tags.includes(needle) || tags.some((tag) => tag.includes(needle)));
}

function nameParts(name) {
  const parts = clean(name).split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.at(-1) };
}

function inferState(row, tags) {
  const state = clean(row.state).toUpperCase();
  if (state) return state;
  const city = clean(row.city).toLowerCase();
  const source = clean(row.source).toLowerCase();
  if (city.includes('adelaide') || source.includes('adelaide') || hasAnyTag(tags, ['place:adelaide', 'place:sa'])) return 'SA';
  if (city.includes('perth') || hasAnyTag(tags, ['place:wa', 'perth'])) return 'WA';
  if (city.includes('brisbane') || hasAnyTag(tags, ['place:qld', 'brisbane'])) return 'QLD';
  if (city.includes('melbourne') || hasAnyTag(tags, ['place:vic', 'melbourne', 'victoria'])) return 'VIC';
  if (city.includes('sydney') || city.includes('mount druitt') || hasAnyTag(tags, ['place:nsw', 'sydney', 'mounty'])) return 'NSW';
  if (city.includes('hobart') || hasAnyTag(tags, ['place:tas', 'tasmania'])) return 'TAS';
  if (city.includes('alice') || hasAnyTag(tags, ['place:nt', 'central australia'])) return 'NT';
  return '';
}

function inferLocation(row, state) {
  const city = clean(row.city);
  if (city) return city;
  if (state === 'SA') return 'South Australia';
  if (state === 'WA') return 'Western Australia';
  if (state === 'QLD') return 'Queensland';
  if (state === 'VIC') return 'Victoria';
  if (state === 'NSW') return 'New South Wales';
  if (state === 'TAS') return 'Tasmania';
  if (state === 'NT') return 'Northern Territory';
  return '';
}

function deriveWarmSignals(row, tags) {
  const haystack = `${row.segment || ''} ${row.reason || ''} ${row.source || ''} ${row.company || ''} ${row.name || ''}`.toLowerCase();
  const signals = [];
  const add = (label, condition) => {
    if (condition) signals.push(label);
  };

  add('contained hot lead', hasAnyTag(tags, ['contained-hot-lead', 'container-request', 'interest:container']));
  add('original requester', hasAnyTag(tags, ['contained-original-requester']));
  add('personal outreach', hasAnyTag(tags, ['contained-personal-outreach']));
  add('inquiry source', hasAnyTag(tags, ['source:inquiry']));
  add('gmail discovery', hasAnyTag(tags, ['source:gmail-discovery']));
  add('JusticeHub relationship', hasAnyTag(tags, ['project:act-jh', 'justicehub', 'interest:justice-reform']));
  add('Adelaide/SA relevance', hasAnyTag(tags, ['place:adelaide', 'place:sa', 'adelaide']) || haystack.includes('adelaide'));
  add('delivery or partner circle', /delivery|vip|partner|diagrama|flinders|jri|puzzle|syc/.test(haystack));
  return signals;
}

function deriveEngagement(row, tags, signals) {
  const segment = clean(row.segment).toLowerCase();
  if (segment.includes('delivery')) return 'active-delivery';
  if (segment.includes('vip')) return 'personal-vip';
  if (signals.some((s) => ['contained hot lead', 'original requester', 'inquiry source'].includes(s))) return 'hot';
  if (signals.length >= 2 || segment.includes('future tour')) return 'warm';
  if (hasAnyTag(tags, ['newsletter ok', 'newsletter', 'future city lead'])) return 'nurture';
  return 'review';
}

function derivePipelineStage(row, engagement) {
  const segment = clean(row.segment).toLowerCase();
  if (segment.includes('delivery') || segment.includes('vip')) return 'Personal invite';
  if (engagement === 'hot') return 'Warm review';
  if (segment.includes('future tour')) return 'Future city / partner';
  if (engagement === 'warm') return 'Needs enrichment';
  return 'Captured / newsletter nurture';
}

function deriveNewsletterStreams(row, tags, state, engagement) {
  const streams = new Set();
  const text = `${row.segment || ''} ${row.reason || ''} ${row.company || ''} ${row.source || ''}`.toLowerCase();

  if (state === 'SA' || text.includes('adelaide') || hasAnyTag(tags, ['place:adelaide', 'place:sa'])) streams.add('contained-adelaide-invite');
  if (hasAnyTag(tags, ['interest:justice-reform', 'project:act-jh', 'justicehub']) || /justice|youth|remand|legal|court|university|policy/.test(text)) streams.add('youth-justice-brief');
  if (hasAnyTag(tags, ['media', 'role:media']) || /media|journalist|communications|publishing/.test(text)) streams.add('media-pack');
  if (hasAnyTag(tags, ['funder', 'philanthropy', 'foundation', 'role:funder']) || /foundation|trust|philanthropy|funder/.test(text)) streams.add('funder-brief');
  if (engagement === 'active-delivery' || engagement === 'personal-vip') streams.add('daily-adelaide-recap');
  if (clean(row.segment).toLowerCase().includes('future tour') || hasAnyTag(tags, ['future city lead'])) streams.add('future-tour-update');

  return [...streams];
}

function deriveActivationAsk(row, engagement, streams) {
  if (engagement === 'active-delivery') return 'Confirm role, room responsibility, and daily follow-up owner';
  if (engagement === 'personal-vip') return 'Personal invite to attend, endorse, introduce, or host aligned people';
  if (streams.includes('media-pack')) return 'Offer media pack and invite to capture youth justice/remand story angle';
  if (streams.includes('funder-brief')) return 'Invite funder briefing and ask for support pathway';
  if (streams.includes('contained-adelaide-invite')) return 'Invite to book the 30-minute Adelaide experience and bring one aligned person';
  if (streams.includes('future-tour-update')) return 'Invite to register city interest and nominate local partners';
  return 'Invite newsletter opt-in and ask for one relevant introduction';
}

function suppressionReason(row, tags) {
  if (String(row.dnd).toLowerCase() === 'true') return 'DND in GHL';
  if (hasAnyTag(tags, ['unsubscribe', 'unsubscribed', 'do-not-contact', 'dnd', 'bounced', 'fake', 'test'])) return 'Suppressed tag present';
  if (!clean(row.email)) return 'No email for bulk import';
  return '';
}

function deriveSuggestedTags(row, tags, state, engagement, stage, streams) {
  const tagSet = new Set([
    'project:contained-adelaide-2026',
    'project:contained',
    `engagement:${engagement}`,
    `campaign-stage:${stage.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  ]);

  if (state) tagSet.add(`place:${state.toLowerCase()}`);
  for (const stream of streams) tagSet.add(`newsletter-stream:${stream}`);
  if (clean(row.segment).toLowerCase().includes('vip')) tagSet.add('ring:vip');
  if (clean(row.segment).toLowerCase().includes('delivery')) tagSet.add('ring:delivery-circle');
  if (hasAnyTag(tags, ['source:gmail-discovery'])) tagSet.add('source:gmail-discovery');
  if (hasAnyTag(tags, ['source:inquiry'])) tagSet.add('source:inquiry');
  return [...tagSet].sort();
}

function normaliseContact(row) {
  const existingTags = splitTags(row.tags);
  const state = inferState(row, existingTags);
  const location = inferLocation(row, state);
  const signals = deriveWarmSignals(row, existingTags);
  const engagement = deriveEngagement(row, existingTags, signals);
  const stage = derivePipelineStage(row, engagement);
  const streams = deriveNewsletterStreams(row, existingTags, state, engagement);
  const ask = deriveActivationAsk(row, engagement, streams);
  const suppression = suppressionReason(row, existingTags);
  const suggestedTags = deriveSuggestedTags(row, existingTags, state, engagement, stage, streams);
  const { firstName, lastName } = nameParts(row.name);

  return {
    'GHL ID': row.ghl_id,
    'First Name': firstName,
    'Last Name': lastName,
    'Full Name': clean(row.name),
    Email: clean(row.email),
    Phone: clean(row.phone),
    Company: clean(row.company),
    Location: location,
    State: state,
    Source: clean(row.source),
    Segment: clean(row.segment),
    'Warm Signals': signals.join('; '),
    Engagement: engagement,
    Priority: engagement === 'active-delivery' || engagement === 'personal-vip' ? 'A - personal' : engagement === 'hot' ? 'B - hot' : engagement === 'warm' ? 'C - warm' : 'D - nurture',
    'Pipeline Name': PIPELINE_NAME,
    'Pipeline Stage': stage,
    'Opportunity Name': `${clean(row.name) || clean(row.email) || clean(row.company)} - ${PIPELINE_NAME}`,
    'Newsletter Streams': streams.join('; '),
    'Activation Ask': ask,
    'Tags To Add': suggestedTags.join('; '),
    'Existing Tags': clean(row.tags),
    'Consent Status': suppression ? 'Do not bulk email' : 'Needs consent check',
    'Suppression Reason': suppression,
    Notes: [
      clean(row.reason) && `Audit reason: ${clean(row.reason)}`,
      signals.length ? `Signals: ${signals.join(', ')}` : '',
      `Prepared from ${clean(row.segment) || 'GHL audit'}`,
    ].filter(Boolean).join(' | '),
  };
}

function extractSasecSeeds(source) {
  const raw = fs.readFileSync(source.path, 'utf8').replace(/^while\(1\);\s*/, '');
  const parsed = JSON.parse(raw);
  const structure = parsed.JsonStructure || '';
  const recordRegex = /c2:\[\{fft:\d+, v:'([^']*)'\},\{fft:\d+, v:'([^']*)'\}\],c3:\[\{sft:\d+, v:'([^']*)'\}\],c4:\[\{fft:\d+, v:'([^']*)'\}\]/g;
  const seeds = [];
  let match;

  while ((match = recordRegex.exec(structure)) !== null) {
    const [, name, categories, memberType, servicing] = match.map(clean);
    if (!name) continue;
    seeds.push({
      Name: name,
      Organisation: name,
      Email: '',
      Website: '',
      Location: servicing || source.defaultLocation,
      State: source.defaultState,
      Source: source.label,
      Category: categories,
      'Why Relevant': `${memberType}; SA social enterprise / community economy source`,
      'Suggested Tags': source.defaultTags.join('; '),
      'Suggested Ask': 'Review for Adelaide invite, community partner role, media/artifact support, or youth voice amplification',
      'Review Status': 'Needs human review before import',
    });
  }
  return seeds;
}

function extractSecnaSeeds(source) {
  const data = maybeReadJson(source.path);
  const items = Array.isArray(data?.items) ? data.items : [];
  return items
    .map((item) => {
      const fields = item.custom_fields || {};
      const values = Object.values(fields).map((value) => Array.isArray(value) ? value.join('; ') : value).map(clean).filter(Boolean);
      const website = values.find((value) => /\.[a-z]{2,}/i.test(value) && !value.includes(' ')) || '';
      return {
        Name: clean(item.name),
        Organisation: clean(item.name),
        Email: '',
        Website: website,
        Location: clean(item.location || item.address || source.defaultLocation),
        State: source.defaultState,
        Source: source.label,
        Category: values.filter((value) => value !== website).slice(0, 4).join('; '),
        'Why Relevant': 'Social enterprise directory match; review for local relevance and youth/community alignment',
        'Suggested Tags': source.defaultTags.join('; '),
        'Suggested Ask': 'Review for partner, community connector, or future-city pathway',
        'Review Status': 'Needs human review before import',
      };
    })
    .filter((seed) => seed.Name);
}

function extractSupplyNationSeeds(source) {
  const data = maybeReadJson(source.path);
  if (!Array.isArray(data)) return [];

  return data
    .filter((item) => {
      const cities = clean(item.Account__r?.Cities__c || item.Cities__c).toUpperCase();
      return cities.split(';').map((part) => part.trim()).includes('SA');
    })
    .map((item) => ({
      Name: clean(item.AccountName__c),
      Organisation: clean(item.AccountName__c),
      Email: '',
      Website: '',
      Location: source.defaultLocation,
      State: source.defaultState,
      Source: source.label,
      Category: [
        item.Certified__c ? 'Certified' : '',
        item.IndigenousMarketplace__c ? 'Indigenous Marketplace' : '',
        clean(item.CompanysAnnualRevenue__c),
        item.Employees__c ? `${item.Employees__c} employees` : '',
      ].filter(Boolean).join('; '),
      'Why Relevant': 'First Nations business servicing SA; review for local procurement, build, media, food, crew, or community role',
      'Suggested Tags': source.defaultTags.join('; '),
      'Suggested Ask': 'Review for culturally appropriate partnership/procurement or community connector pathway',
      'Review Status': 'Needs human review before import',
    }))
    .filter((seed) => seed.Name)
    .slice(0, 250);
}

function buildDiscoverySeeds() {
  const seeds = [];
  const sourceStats = [];

  for (const source of DISCOVERY_SOURCES) {
    let extracted = [];
    try {
      if (source.id === 'sasec-members') extracted = extractSasecSeeds(source);
      if (source.id === 'secna-directory') extracted = extractSecnaSeeds(source);
      if (source.id === 'supply-nation-sa') extracted = extractSupplyNationSeeds(source);
    } catch (error) {
      sourceStats.push({ id: source.id, path: source.path, count: 0, error: error.message });
      continue;
    }

    for (const seed of extracted) seeds.push(seed);
    sourceStats.push({ id: source.id, path: source.path, count: extracted.length });
  }

  const seen = new Set();
  const unique = [];
  for (const seed of seeds) {
    const key = `${seed.Name}|${seed.Source}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(seed);
  }

  return { seeds: unique, sourceStats };
}

function writeStrategy({ contacts, importRows, personalRows, warmRows, discovery, sourceStats }) {
  const codebaseRows = CODEBASE_ALIGNMENT.map(([label, relPath]) => {
    const exists = fs.existsSync(path.join(ROOT, relPath.split(' and ')[0]));
    return `| ${label} | \`${relPath}\` | ${exists ? 'exists' : 'check'} |`;
  }).join('\n');

  const stageCounts = countBy(contacts, 'Pipeline Stage');
  const streamCounts = {};
  for (const row of contacts) {
    for (const stream of String(row['Newsletter Streams']).split(';').map(clean).filter(Boolean)) {
      streamCounts[stream] = (streamCounts[stream] || 0) + 1;
    }
  }

  const md = `# CONTAINED Adelaide GHL Import Strategy

Generated: ${new Date().toISOString()}

## What This Output Is

This is the review/import layer for CONTAINED Adelaide. It does not push to GoHighLevel. It prepares the current audited GHL/Notion contact pool, then adds discovery seeds from GrantScope sources for review before any outreach.

## Current Contact Pool

- Audited contacts reviewed: ${contacts.length}
- Bulk-import/update candidates with email and no suppression: ${importRows.length}
- Personal outreach rows without bulk email pathway: ${personalRows.length}
- Warm group rows: ${warmRows.length}
- Discovery seed organisations for review: ${discovery.length}

## Pipeline Stages

${Object.entries(stageCounts).sort((a, b) => b[1] - a[1]).map(([stage, count]) => `- ${stage}: ${count}`).join('\n')}

## Newsletter Streams

${Object.entries(streamCounts).sort((a, b) => b[1] - a[1]).map(([stream, count]) => `- ${stream}: ${count}`).join('\n')}

## Codebase Alignment

| Surface | Path | Status |
| --- | --- | --- |
${codebaseRows}

## Import Rules

- Import/update from \`contained-ghl-import.csv\` only after spot-checking consent and duplicates.
- Use \`contained-personal-outreach.csv\` for relationship-led asks; do not bulk email these rows.
- Use \`contained-warm-group.csv\` as the first call list for personal invites, room support, media, and partner intros.
- Use \`contained-discovery-seeds.csv\` as research backlog, not as a direct mailing list.
- Tags in \`Tags To Add\` are additive. Keep existing tags in GHL unless there is a separate cleanup task.

## Recommended GHL Build

- Pipeline: ${PIPELINE_NAME}
- Stages: Captured / newsletter nurture; Needs enrichment; Warm review; Personal invite; Booking link sent; Booked; Experienced; Activated; Future city / partner; No contact.
- Forms: full 30-minute experience booking, open viewing RSVP, crew/jumpsuit volunteer, Justice Hub activation pledge, media request.
- Newsletters: Adelaide invite, daily Adelaide recap, youth justice brief, media pack, funder brief, future tour update.
- Custom fields: Location, State, Experience Role, Newsletter Streams, Activation Ask, Relationship Owner, Evidence Source, Review Status.

## Discovery Sources Read

${sourceStats.map((stat) => `- ${stat.id}: ${stat.count} rows${stat.error ? ` (${stat.error})` : ''}`).join('\n')}

## Next Agents To Run

1. Gmail relationship sweep: find recent inbound/replied CONTAINED, Adelaide, JusticeHub, Diagrama, remand, Flinders, Tandanya, Victoria Square threads and mark evidence source.
2. GrantScope entity match: link organisations from this CSV to CivicGraph entities and add sector/state/category confidence.
3. Public web enrichment: find safe public website/contact pages for discovery seeds, prioritising SA youth justice, Aboriginal-led, media, legal, social enterprise, university, and community organisations.
4. GHL import dry run: compare CSV rows against live GHL by email/phone before creating opportunities.
`;

  fs.writeFileSync(OUTPUTS.strategyMd, md);
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = clean(row[key]) || 'Unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function writeManifest(summary) {
  fs.writeFileSync(OUTPUTS.manifestJson, JSON.stringify({
    generatedAt: new Date().toISOString(),
    mode: 'file-only-no-ghl-mutation',
    pipelineName: PIPELINE_NAME,
    outputs: OUTPUTS,
    codebaseAlignment: CODEBASE_ALIGNMENT.map(([label, relPath]) => ({ label, path: relPath, exists: fs.existsSync(path.join(ROOT, relPath.split(' and ')[0])) })),
    recommendedAgents: [
      {
        id: 'gmail-contained-relationship-sweep',
        purpose: 'Find inbound/replied relationship evidence before assigning warm/personal status.',
        querySeeds: ['CONTAINED', 'contained', 'Adelaide', 'JusticeHub', 'Diagrama', 'remand', 'Flinders', 'Tandanya', 'Victoria Square'],
        output: 'Append evidence source, relationship owner, and last meaningful interaction before GHL import.',
      },
      {
        id: 'grantscope-civicgraph-match',
        purpose: 'Match discovery organisations to CivicGraph/GrantScope entities.',
        inputs: [OUTPUTS.discoveryCsv],
        output: 'Entity id, sector, state, public website, confidence, and reason.',
      },
      {
        id: 'public-contact-enrichment',
        purpose: 'Find public organisation contact pages for reviewed discovery seeds.',
        guardrail: 'Only use public organisational contacts; do not infer personal emails.',
      },
      {
        id: 'ghl-preflight-dedupe',
        purpose: 'Check import CSV against live GHL by email/phone/company before mutation.',
        guardrail: 'Dry-run first; create/update only after human review.',
      },
    ],
    summary,
  }, null, 2));
}

function main() {
  ensureOutDir();
  if (!fs.existsSync(SEGMENTS_PATH)) {
    throw new Error(`Missing ${SEGMENTS_PATH}. Run scripts/export-contained-adelaide-ghl-segments.mjs first.`);
  }

  const segments = readJson(SEGMENTS_PATH);
  const rawContacts = Array.isArray(segments.candidates) ? segments.candidates : [];
  const contacts = rawContacts.map(normaliseContact);

  const importRows = contacts.filter((row) => !row['Suppression Reason'] && row.Email);
  const personalRows = contacts.filter((row) => row['Suppression Reason'] || row.Priority === 'A - personal');
  const warmRows = contacts.filter((row) => ['A - personal', 'B - hot', 'C - warm'].includes(row.Priority));
  const tagRows = contacts.map((row) => ({
    'GHL ID': row['GHL ID'],
    Email: row.Email,
    'Full Name': row['Full Name'],
    'Tags To Add': row['Tags To Add'],
    Engagement: row.Engagement,
    'Pipeline Stage': row['Pipeline Stage'],
    'Suppression Reason': row['Suppression Reason'],
  }));

  const { seeds: discovery, sourceStats } = buildDiscoverySeeds();

  const importColumns = [
    'GHL ID', 'First Name', 'Last Name', 'Full Name', 'Email', 'Phone', 'Company', 'Location', 'State',
    'Source', 'Segment', 'Warm Signals', 'Engagement', 'Priority', 'Pipeline Name', 'Pipeline Stage',
    'Opportunity Name', 'Newsletter Streams', 'Activation Ask', 'Tags To Add', 'Consent Status', 'Notes',
  ];
  const personalColumns = [...importColumns, 'Suppression Reason', 'Existing Tags'];
  const discoveryColumns = [
    'Name', 'Organisation', 'Email', 'Website', 'Location', 'State', 'Source', 'Category',
    'Why Relevant', 'Suggested Tags', 'Suggested Ask', 'Review Status',
  ];
  const tagColumns = ['GHL ID', 'Email', 'Full Name', 'Tags To Add', 'Engagement', 'Pipeline Stage', 'Suppression Reason'];

  writeCsv(OUTPUTS.importCsv, importRows, importColumns);
  writeCsv(OUTPUTS.personalCsv, personalRows, personalColumns);
  writeCsv(OUTPUTS.warmCsv, warmRows, personalColumns);
  writeCsv(OUTPUTS.discoveryCsv, discovery, discoveryColumns);
  writeCsv(OUTPUTS.tagActionsCsv, tagRows, tagColumns);

  const summary = {
    contactsReviewed: contacts.length,
    importRows: importRows.length,
    personalRows: personalRows.length,
    warmRows: warmRows.length,
    discoveryRows: discovery.length,
    suppressedRows: contacts.filter((row) => row['Suppression Reason']).length,
    stageCounts: countBy(contacts, 'Pipeline Stage'),
    engagementCounts: countBy(contacts, 'Engagement'),
    discoverySourceStats: sourceStats,
  };

  writeStrategy({ contacts, importRows, personalRows, warmRows, discovery, sourceStats });
  writeManifest(summary);

  console.log(JSON.stringify(summary, null, 2));
}

main();
